import { useState, useEffect } from "react";
import ProductForm from "@components/ProductForm";
import ProductFilters from "@components/ProductFilters";
import { ProductData } from "@schemas/productSchema";
import { Button } from "@components/button";
import { toast } from "react-toastify";
import { Product } from "@/types/Product";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { ViewDataTable } from "@components/trucks/ViewDataTable";
import { Trash, Pencil, Filter } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@components/shadcn-ui/Tooltip";
import { productsApi } from "@/api/products";
import { PageHeader } from "@components/PageHeader";
import { getFilterIconClassName } from "@/lib/utils";

const createTableColumns = (
  onEdit: (product: Product) => void,
  onDelete: (id: number) => void
): ColumnDef<Product>[] => [
  {
    accessorKey: "name",
    header: "Nome",
  },
  {
    accessorKey: "family",
    header: "Família",
    cell: ({ row }) => {
      const family = row.getValue("family") as Product["family"];
      return family?.name || "-";
    },
  },
  {
    id: "dimensions",
    accessorFn: (row) => {
      const dim = row.dimensions;
      return dim ? (dim.length * dim.width * dim.height) : 0;
    },
    header: ({ column }) => {
      return (
        <button
          className="flex items-center gap-1 hover:text-[#744625] transition-colors"
          onClick={() => {
            const isAsc = column.getIsSorted() === "asc";
            column.toggleSorting(isAsc);
          }}
        >
          Dimensões (cm)
          <span className="text-xs">
            {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
          </span>
        </button>
      );
    },
    cell: ({ row }) => {
      const dimensions = row.original.dimensions;
      if (!dimensions || dimensions.length === undefined || dimensions.width === undefined || dimensions.height === undefined) {
        return "-";
      }
      return `${dimensions.length} x ${dimensions.width} x ${dimensions.height}`;
    },
  },
  {
    accessorKey: "weight",
    header: ({ column }) => {
      return (
        <button
          className="flex items-center gap-1 hover:text-[#744625] transition-colors"
          onClick={() => {
            const isAsc = column.getIsSorted() === "asc";
            column.toggleSorting(isAsc);
          }}
        >
          Peso (kg)
          <span className="text-xs">
            {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
          </span>
        </button>
      );
    },
    cell: ({ row }) => {
      const weight = row.getValue("weight") as number;
      return weight.toFixed(2);
    },
  },
  {
    accessorKey: "maxSupportedWeight",
    header: ({ column }) => {
      return (
        <button
          className="flex items-center gap-1 hover:text-[#744625] transition-colors"
          onClick={() => {
            const isAsc = column.getIsSorted() === "asc";
            column.toggleSorting(isAsc);
          }}
        >
          Peso Máx. Suportado (kg)
          <span className="text-xs">
            {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
          </span>
        </button>
      );
    },
    cell: ({ row }) => {
      const weight = row.getValue("maxSupportedWeight") as number;
      return weight.toFixed(2);
    },
  },
  {
    accessorKey: "batch",
    header: "Lote",
    cell: ({ row }) => {
      const batch = row.getValue("batch") as string | undefined;
      return batch || "-";
    },
  },
  {
    accessorKey: "fragile",
    header: "Frágil",
    cell: ({ row }) => {
      const fragile = row.getValue("fragile") as boolean;
      return fragile ? "Sim" : "Não";
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const product = row.original;
      return (
        <div className="flex gap-2 justify-end">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                className="cursor-pointer" 
                onClick={() => onEdit(product)}
              >
                <Pencil />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Editar produto</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="destructive" 
                className="cursor-pointer" 
                onClick={() => onDelete(product.id)}
              >
                <Trash />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Excluir produto</TooltipContent>
          </Tooltip>
        </div>
      );
    },
  },
];

async function fetchProducts(page: number, size: number, filters?: { name?: string; familyId?: string; batch?: string; fragile?: string }) {
  try {
    return await productsApi.getAll(page, size, filters);
  } catch {
    return { products: [], total: 0, totalPages: 0, currentPage: 0, hasNext: false, hasPrevious: false };
  }
}

async function handleAddProduct(data: ProductData) {
  return await productsApi.create(data);
}

async function handleUpdateProduct(id: number, data: ProductData) {
  return await productsApi.update(id, data);
}

async function handleDeleteProduct(id: number) {
  await productsApi.delete(id);
}

type FilterData = {
  name: string;
  familyId: string;
  batch: string;
  fragile: string;
};

export default function ProductList() {
  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [filters, setFilters] = useState<FilterData>({
    name: "",
    familyId: "",
    batch: "",
    fragile: "",
  });
  const queryClient = useQueryClient();

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(8);

  const {
    data: productsData,
    isPending: isLoading,
  } = useQuery<{ products: Product[]; total: number; totalPages: number; currentPage: number; hasNext: boolean; hasPrevious: boolean }>({
    queryKey: ["products", currentPage, pageSize, filters],
    queryFn: () => fetchProducts(currentPage, pageSize, filters),
  });

  const products = productsData?.products || [];

  const productMutation = useMutation({
    mutationKey: ["save-products"],
    mutationFn: editingProduct ? 
      (data: ProductData) => handleUpdateProduct(editingProduct.id, data) :
      handleAddProduct,
    onSuccess: () => {
      toast.success(editingProduct ? "Produto atualizado com sucesso!" : "Produto adicionado com sucesso!");
      setShowForm(false);
      setEditingProduct(null);
      setCurrentPage(0);
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || error?.response?.data?.message || (editingProduct ? "Erro ao atualizar produto. Tente novamente." : "Erro ao adicionar produto. Tente novamente.");
      toast.error(errorMessage);
    },
  });

  const deleteMutation = useMutation({
    mutationKey: ["delete-products"],
    mutationFn: handleDeleteProduct,
    onSuccess: () => {
      toast.success("Produto excluído com sucesso!");
      setCurrentPage(0);
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: () => {
      toast.error("Erro ao excluir produto. Tente novamente.");
    },
  });

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir este produto?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleFormClose = (open: boolean) => {
    setShowForm(open);
    if (!open) {
      setEditingProduct(null);
    }
  };

  const handleApplyFilters = (newFilters: FilterData) => {
    setFilters(newFilters);
    setCurrentPage(0);
  };

  const totalItems = productsData?.total || 0;
  const totalPages = productsData?.totalPages || 0;
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
        title="Gerenciamento de Produtos"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowFilters(true)}>
              <Filter className={`mr-2 h-4 w-4 ${getFilterIconClassName(filters)}`} />
              Filtros
            </Button>
            <Button onClick={() => setShowForm(true)}>Cadastrar Produto</Button>
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
            {isLoading ? "Carregando..." : `Mostrando ${products.length} de ${totalItems} registros`}
          </div>
        </div>
        <ViewDataTable columns={tableColumns} data={products} isLoading={isLoading} />
          
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
      <ProductForm
        onSubmit={productMutation.mutate}
        open={showForm}
        handleOpenChange={handleFormClose}
        editingProduct={editingProduct}
      />
      <ProductFilters
        open={showFilters}
        onOpenChange={setShowFilters}
        onApplyFilters={handleApplyFilters}
        initialFilters={filters}
      />
    </div>
  );
}

