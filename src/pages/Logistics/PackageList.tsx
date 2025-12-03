import { useState, useEffect } from "react";
import PackageForm from "@components/PackageForm";
import PackageFilters from "@components/PackageFilters";
import { PackageData } from "@schemas/packageSchema";
import { Button } from "@components/button";
import { toast } from "react-toastify";
import { Package } from "@/types/Package";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { ViewDataTable } from "@components/trucks/ViewDataTable";
import { Trash, Pencil, Filter } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@components/shadcn-ui/Tooltip";
import { packagesApi } from "@/api/packages";
import { PageHeader } from "@components/PageHeader";
import { getFilterIconClassName } from "@/lib/utils";

const createTableColumns = (
  onEdit: (pkg: Package) => void,
  onDelete: (id: number) => void
): ColumnDef<Package>[] => [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "packaging",
    header: "Embalagem",
    cell: ({ row }) => {
      const packaging = row.getValue("packaging") as Package["packaging"];
      return packaging?.name || "-";
    },
  },
  {
    accessorKey: "product",
    header: "Produto",
    cell: ({ row }) => {
      const product = row.getValue("product") as Package["product"];
      return product?.name || "-";
    },
  },
  {
    accessorKey: "loadId",
    header: "Load ID",
    cell: ({ row }) => {
      const loadId = row.getValue("loadId") as number | undefined;
      return loadId ? loadId.toString() : "-";
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const pkg = row.original;
      return (
        <div className="flex gap-2 justify-end">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                className="cursor-pointer" 
                onClick={() => onEdit(pkg)}
              >
                <Pencil />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Editar pacote</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="destructive" 
                className="cursor-pointer" 
                onClick={() => onDelete(pkg.id)}
              >
                <Trash />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Excluir pacote</TooltipContent>
          </Tooltip>
        </div>
      );
    },
  },
];

async function fetchPackages(page: number, size: number, filters?: { packagingName?: string; productId?: string }) {
  try {
    return await packagesApi.getAll(page, size, filters);
  } catch {
    return { packages: [], total: 0, totalPages: 0, currentPage: 0, hasNext: false, hasPrevious: false };
  }
}

async function handleAddPackage(data: PackageData) {
  return await packagesApi.create(data);
}

async function handleUpdatePackage(id: number, data: PackageData) {
  return await packagesApi.update(id, data);
}

async function handleDeletePackage(id: number) {
  await packagesApi.delete(id);
}

type FilterData = {
  packagingName: string;
  productId: string;
};

export default function PackageList() {
  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [filters, setFilters] = useState<FilterData>({
    packagingName: "",
    productId: "",
  });
  const queryClient = useQueryClient();

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(8);

  const {
    data: packagesData,
    isPending: isLoading,
  } = useQuery<{ packages: Package[]; total: number; totalPages: number; currentPage: number; hasNext: boolean; hasPrevious: boolean }>({
    queryKey: ["packages", currentPage, pageSize, filters],
    queryFn: () => fetchPackages(currentPage, pageSize, filters),
  });

  const packages = packagesData?.packages || [];

  const packageMutation = useMutation({
    mutationKey: ["save-packages"],
    mutationFn: editingPackage ? 
      (data: PackageData) => handleUpdatePackage(editingPackage.id, data) :
      handleAddPackage,
    onSuccess: () => {
      toast.success(editingPackage ? "Pacote atualizado com sucesso!" : "Pacote adicionado com sucesso!");
      setShowForm(false);
      setEditingPackage(null);
      setCurrentPage(0);
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      queryClient.invalidateQueries({ queryKey: ["packagings"] });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || error?.response?.data?.message || (editingPackage ? "Erro ao atualizar pacote. Tente novamente." : "Erro ao adicionar pacote. Tente novamente.");
      toast.error(errorMessage);
    },
  });

  const deleteMutation = useMutation({
    mutationKey: ["delete-packages"],
    mutationFn: handleDeletePackage,
    onSuccess: () => {
      toast.success("Pacote excluído com sucesso!");
      setCurrentPage(0);
      queryClient.invalidateQueries({ queryKey: ["packages"] });
    },
    onError: () => {
      toast.error("Erro ao excluir pacote. Tente novamente.");
    },
  });

  const handleEdit = (pkg: Package) => {
    setEditingPackage(pkg);
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir este pacote?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleFormClose = (open: boolean) => {
    setShowForm(open);
    if (!open) {
      setEditingPackage(null);
    }
  };

  const handleApplyFilters = (newFilters: FilterData) => {
    setFilters(newFilters);
    setCurrentPage(0);
  };

  const totalItems = packagesData?.total || 0;
  const totalPages = packagesData?.totalPages || 0;
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
        title="Gerenciamento de Pacotes"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowFilters(true)}>
              <Filter className={`mr-2 h-4 w-4 ${getFilterIconClassName(filters)}`} />
              Filtros
            </Button>
            <Button onClick={() => setShowForm(true)}>Cadastrar Pacote</Button>
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
            {isLoading ? "Carregando..." : `Mostrando ${packages.length} de ${totalItems} registros`}
          </div>
        </div>
        <ViewDataTable columns={tableColumns} data={packages} isLoading={isLoading} />
          
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
      <PackageForm
        onSubmit={packageMutation.mutate}
        open={showForm}
        handleOpenChange={handleFormClose}
        editingPackage={editingPackage}
      />
      <PackageFilters
        open={showFilters}
        onOpenChange={setShowFilters}
        onApplyFilters={handleApplyFilters}
        initialFilters={filters}
      />
    </div>
  );
}
