import { useState, useEffect } from "react";
import ProductFamilyForm from "@components/ProductFamilyForm";
import ProductFamilyFilters from "@components/ProductFamilyFilters";
import { ProductFamilyData } from "@schemas/productFamilySchema";
import { Button } from "@components/button";
import { toast } from "react-toastify";
import { ProductFamily } from "@/types/ProductFamily";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { ViewDataTable } from "@components/trucks/ViewDataTable";
import { Trash, Pencil, Filter } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@components/shadcn-ui/Tooltip";
import { productFamiliesApi } from "@/api/productFamilies";
import { PageHeader } from "@components/PageHeader";
import { getFilterIconClassName } from "@/lib/utils";

const createTableColumns = (
  onEdit: (family: ProductFamily) => void,
  onDelete: (id: number) => void
): ColumnDef<ProductFamily>[] => [
  {
    accessorKey: "name",
    header: "Nome",
  },
  {
    accessorKey: "description",
    header: "Descrição",
    cell: ({ row }) => {
      const description = row.getValue("description") as string;
      return description || "-";
    },
  },
  {
    accessorKey: "defaultMaxSupportedWeight",
    header: ({ column }) => {
      return (
        <button
          className="flex items-center gap-1 hover:text-[#744625] transition-colors"
          onClick={() => {
            const isAsc = column.getIsSorted() === "asc";
            column.toggleSorting(isAsc);
          }}
        >
          Peso Máx. Suportado por Padrão (kg)
          <span className="text-xs">
            {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
          </span>
        </button>
      );
    },
    cell: ({ row }) => {
      const weight = row.getValue("defaultMaxSupportedWeight") as number;
      if (weight === null || weight === undefined || isNaN(weight)) {
        return "0.00";
      }
      return Number(weight).toFixed(2);
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const family = row.original;
      return (
        <div className="flex gap-2 justify-end">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="cursor-pointer"
                onClick={() => onEdit(family)}
              >
                <Pencil />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Editar família</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="destructive"
                className="cursor-pointer"
                onClick={() => onDelete(family.id)}
              >
                <Trash />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Excluir família</TooltipContent>
          </Tooltip>
        </div>
      );
    },
  },
];

async function fetchProductFamilies(page: number, size: number, filters?: FilterData) {
  try {
    return await productFamiliesApi.getAll(page, size, filters);
  } catch {
    return { families: [], total: 0, totalPages: 0, currentPage: 0, hasNext: false, hasPrevious: false };
  }
}

async function handleAddFamily(data: ProductFamilyData) {
  return await productFamiliesApi.create(data);
}

async function handleUpdateFamily(id: number, data: ProductFamilyData) {
  return await productFamiliesApi.update(id, data);
}

async function handleDeleteFamily(id: number) {
  await productFamiliesApi.delete(id);
}

type FilterData = {
  name: string;
  description: string;
};

export default function ProductFamilyList() {
  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingFamily, setEditingFamily] = useState<ProductFamily | null>(null);
  const [filters, setFilters] = useState<FilterData>({
    name: "",
    description: "",
  });
  const queryClient = useQueryClient();

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(8);

  const {
    data: familiesData,
    isPending: isLoading,
  } = useQuery<{ families: ProductFamily[]; total: number; totalPages: number; currentPage: number; hasNext: boolean; hasPrevious: boolean }>({
    queryKey: ["productFamilies", currentPage, pageSize, filters],
    queryFn: () => fetchProductFamilies(currentPage, pageSize, filters),
  });

  const families = familiesData?.families || [];

  const familyMutation = useMutation({
    mutationKey: ["save-product-families"],
    mutationFn: editingFamily ?
      (data: ProductFamilyData) => handleUpdateFamily(editingFamily.id, data) :
      handleAddFamily,
    onSuccess: () => {
      toast.success(editingFamily ? "Família atualizada com sucesso!" : "Família adicionada com sucesso!");
      setShowForm(false);
      setEditingFamily(null);
      setCurrentPage(0);
      queryClient.invalidateQueries({ queryKey: ["productFamilies"] });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || error?.response?.data?.message || (editingFamily ? "Erro ao atualizar família. Tente novamente." : "Erro ao adicionar família. Tente novamente.");
      toast.error(errorMessage);
    },
  });

  const deleteMutation = useMutation({
    mutationKey: ["delete-product-families"],
    mutationFn: handleDeleteFamily,
    onSuccess: () => {
      toast.success("Família excluída com sucesso!");
      setCurrentPage(0);
      queryClient.invalidateQueries({ queryKey: ["productFamilies"] });
    },
    onError: () => {
      toast.error("Erro ao excluir família. Tente novamente.");
    },
  });

  const handleEdit = (family: ProductFamily) => {
    setEditingFamily(family);
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir esta família?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleFormClose = (open: boolean) => {
    setShowForm(open);
    if (!open) {
      setEditingFamily(null);
    }
  };

  const handleFormSubmit = (data: ProductFamilyData) => {
    familyMutation.mutate(data);
  };

  const handleApplyFilters = (newFilters: FilterData) => {
    setFilters(newFilters);
    setCurrentPage(0);
  };

  const totalItems = familiesData?.total || 0;
  const totalPages = familiesData?.totalPages || 0;
  const hasNext = currentPage < totalPages - 1;
  const hasPrevious = currentPage > 0;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage < 3) {
        for (let i = 0; i < 5; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages - 1);
      } else if (currentPage > totalPages - 4) {
        pages.push(0);
        pages.push("...");
        for (let i = totalPages - 5; i < totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(0);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages - 1);
      }
    }
    
    return pages;
  };

  const handlePageChange = (page: number) => {
    const newPage = Math.max(0, Math.min(page, Math.max(0, totalPages - 1)));
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(e.target.value) || 8;
    if (newSize > 0) {
      setPageSize(newSize);
      setCurrentPage(0);
    }
  };

  useEffect(() => {
    setCurrentPage(0);
  }, [filters, pageSize]);

  const tableColumns = createTableColumns(handleEdit, handleDelete);

  return (
    <div className="p-8">
      <PageHeader
        title="Gerenciamento de Famílias de Produtos"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowFilters(true)}>
              <Filter className={`mr-2 h-4 w-4 ${getFilterIconClassName(filters)}`} />
              Filtros
            </Button>
            <Button onClick={() => setShowForm(true)}>Cadastrar Família</Button>
          </div>
        }
        topClass="top-11"
      />
      <>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label htmlFor="pageSize" className="text-sm text-[#4C2D2D] font-medium">
              Registros por página:
            </label>
            <input
              id="pageSize"
              type="number"
              min="1"
              value={pageSize}
              onChange={handlePageSizeChange}
              className="w-20 p-2 rounded-lg border-2 border-[#CABAAE] bg-[#E5DAD1] text-[#3F2323] text-sm focus:outline-none focus:ring-2 focus:ring-[#744625]"
            />
          </div>
          <div className="text-sm text-[#4C2D2D]">
            {isLoading ? "Carregando..." : `Mostrando ${families.length} de ${totalItems} registros`}
          </div>
        </div>
        <ViewDataTable columns={tableColumns} data={families} isLoading={isLoading} />
          
        {!isLoading && totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  const newPage = Math.max(0, currentPage - 1);
                  setCurrentPage(newPage);
                }}
                disabled={!hasPrevious}
                className="px-4"
              >
                Anterior
              </Button>
              
              <div className="flex gap-1">
                {getPageNumbers().map((page, index) => {
                  if (page === "...") {
                    return (
                      <span key={`ellipsis-${index}`} className="px-3 py-2 text-[#4C2D2D]">
                        ...
                      </span>
                    );
                  }
                  const pageNum = page as number;
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      onClick={() => handlePageChange(pageNum)}
                      disabled={isLoading}
                      className="min-w-[40px]"
                    >
                      {pageNum + 1}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                onClick={() => {
                  if (totalPages > 0) {
                    const newPage = Math.min(totalPages - 1, currentPage + 1);
                    setCurrentPage(newPage);
                  }
                }}
                disabled={!hasNext || totalPages === 0}
                className="px-4"
              >
                Próximo
              </Button>
            </div>
          )}
          
        {!isLoading && (
          <div className="mt-2 text-center text-sm text-[#4C2D2D]">
            Página {currentPage + 1} de {totalPages || 1}
          </div>
        )}
      </>
      <ProductFamilyForm
        onSubmit={handleFormSubmit}
        open={showForm}
        handleOpenChange={handleFormClose}
        editingFamily={editingFamily}
      />
      <ProductFamilyFilters
        open={showFilters}
        onOpenChange={setShowFilters}
        onApplyFilters={handleApplyFilters}
        initialFilters={filters}
      />
    </div>
  );
}

