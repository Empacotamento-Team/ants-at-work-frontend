import { useState, useEffect } from "react";
import TruckModelForm from "@components/TruckModelForm";
import TruckModelFilters from "@components/TruckModelFilters";
import { TruckModelData } from "@schemas/truckModelSchema";
import { Button } from "@components/button";
import { toast } from "react-toastify";
import { TruckModel } from "@/types/TruckModel";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { ViewDataTable } from "@components/trucks/ViewDataTable";
import { Trash, Pencil, Filter } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@components/shadcn-ui/Tooltip";
import { truckModelsApi } from "@/api/truckModels";
import { PageHeader } from "@components/PageHeader";
import { getFilterIconClassName } from "@/lib/utils";

const createTableColumns = (
  onEdit: (model: TruckModel) => void,
  onDelete: (id: string) => void
): ColumnDef<TruckModel>[] => [
  {
    accessorKey: "name",
    header: "Nome",
  },
  {
    accessorKey: "type",
    header: "Tipo",
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      if (type === "BAU") return "Baú";
      if (type === "CARRETA") return "Carreta";
      if (type === "Baú") return "Baú";
      if (type === "Carreta") return "Carreta";
      return type;
    },
  },
  {
    accessorKey: "maximumCapacity",
    header: ({ column }) => {
      return (
        <button
          className="flex items-center gap-1 hover:text-[#744625] transition-colors"
          onClick={() => {
            const isAsc = column.getIsSorted() === "asc";
            column.toggleSorting(isAsc);
          }}
        >
          Capacidade Máxima (kg)
          <span className="text-xs">
            {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
          </span>
        </button>
      );
    },
    cell: ({ row }) => {
      const capacity = row.getValue("maximumCapacity") as number;
      return capacity ? capacity.toLocaleString('pt-BR') : "0";
    },
  },
  {
    accessorKey: "internalLength",
    header: ({ column }) => {
      return (
        <button
          className="flex items-center gap-1 hover:text-[#744625] transition-colors"
          onClick={() => {
            const isAsc = column.getIsSorted() === "asc";
            column.toggleSorting(isAsc);
          }}
        >
          Comprimento (m)
          <span className="text-xs">
            {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
          </span>
        </button>
      );
    },
    cell: ({ row }) => {
      const length = row.getValue("internalLength") as number;
      return length ? length.toFixed(2) : "0.00";
    },
  },
  {
    accessorKey: "internalWidth",
    header: ({ column }) => {
      return (
        <button
          className="flex items-center gap-1 hover:text-[#744625] transition-colors"
          onClick={() => {
            const isAsc = column.getIsSorted() === "asc";
            column.toggleSorting(isAsc);
          }}
        >
          Largura (m)
          <span className="text-xs">
            {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
          </span>
        </button>
      );
    },
    cell: ({ row }) => {
      const width = row.getValue("internalWidth") as number;
      return width ? width.toFixed(2) : "0.00";
    },
  },
  {
    accessorKey: "internalHeight",
    header: ({ column }) => {
      return (
        <button
          className="flex items-center gap-1 hover:text-[#744625] transition-colors"
          onClick={() => {
            const isAsc = column.getIsSorted() === "asc";
            column.toggleSorting(isAsc);
          }}
        >
          Altura (m)
          <span className="text-xs">
            {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
          </span>
        </button>
      );
    },
    cell: ({ row }) => {
      const height = row.getValue("internalHeight") as number;
      return height ? height.toFixed(2) : "0.00";
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const model = row.original;
      return (
        <div className="flex gap-2 justify-end">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="cursor-pointer"
                onClick={() => onEdit(model)}
              >
                <Pencil />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Editar modelo</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="destructive"
                className="cursor-pointer"
                onClick={() => onDelete(model.id)}
              >
                <Trash />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Excluir modelo</TooltipContent>
          </Tooltip>
        </div>
      );
    },
  },
];

async function fetchTruckModels(page: number, size: number, filters?: { name?: string; type?: string }) {
  try {
    return await truckModelsApi.getAll(page, size, filters);
  } catch {
    return { models: [], total: 0, totalPages: 0, currentPage: 0, hasNext: false, hasPrevious: false };
  }
}

async function handleAddModel(data: TruckModelData) {
  return await truckModelsApi.create(data);
}

async function handleUpdateModel(id: string, data: TruckModelData) {
  return await truckModelsApi.update(id, data);
}

async function handleDeleteModel(id: string) {
  await truckModelsApi.delete(id);
}

type FilterData = {
  name: string;
  type: string;
};

export default function TruckModelList() {
  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingModel, setEditingModel] = useState<TruckModel | null>(null);
  const [filters, setFilters] = useState<FilterData>({
    name: "",
    type: "",
  });
  const queryClient = useQueryClient();

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(8);

  const {
    data: modelsData,
    isPending: isLoading,
  } = useQuery<{ models: TruckModel[]; total: number; totalPages: number; currentPage: number; hasNext: boolean; hasPrevious: boolean }>({
    queryKey: ["truckModels", currentPage, pageSize, filters],
    queryFn: () => fetchTruckModels(currentPage, pageSize, filters),
  });

  const models = modelsData?.models || [];

  const modelMutation = useMutation({
    mutationKey: ["save-truck-models"],
    mutationFn: editingModel ?
      (data: TruckModelData) => handleUpdateModel(editingModel.id, data) :
      handleAddModel,
    onSuccess: () => {
      toast.success(editingModel ? "Modelo atualizado com sucesso!" : "Modelo adicionado com sucesso!");
      setShowForm(false);
      setEditingModel(null);
      setCurrentPage(0);
      queryClient.invalidateQueries({ queryKey: ["truckModels"] });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || error?.response?.data?.message || (editingModel ? "Erro ao atualizar modelo. Tente novamente." : "Erro ao adicionar modelo. Tente novamente.");
      toast.error(errorMessage);
    },
  });

  const deleteMutation = useMutation({
    mutationKey: ["delete-truck-models"],
    mutationFn: handleDeleteModel,
    onSuccess: () => {
      toast.success("Modelo excluído com sucesso!");
      setCurrentPage(0);
      queryClient.invalidateQueries({ queryKey: ["truckModels"] });
    },
    onError: () => {
      toast.error("Erro ao excluir modelo. Tente novamente.");
    },
  });

  const handleEdit = (model: TruckModel) => {
    setEditingModel(model);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este modelo?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleFormClose = (open: boolean) => {
    setShowForm(open);
    if (!open) {
      setEditingModel(null);
    }
  };

  const handleFormSubmit = (data: TruckModelData) => {
    modelMutation.mutate(data);
  };

  const handleApplyFilters = (newFilters: FilterData) => {
    setFilters(newFilters);
    setCurrentPage(0);
  };

  const totalItems = modelsData?.total || 0;
  const totalPages = modelsData?.totalPages || 0;
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
        title="Gerenciamento de Modelos de Caminhão"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowFilters(true)}>
              <Filter className={`mr-2 h-4 w-4 ${getFilterIconClassName(filters)}`} />
              Filtros
            </Button>
            <Button onClick={() => setShowForm(true)}>Cadastrar Modelo</Button>
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
            {isLoading ? "Carregando..." : `Mostrando ${models.length} de ${totalItems} registros`}
          </div>
        </div>
        <ViewDataTable columns={tableColumns} data={models} isLoading={isLoading} />
          
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
      <TruckModelForm
        onSubmit={handleFormSubmit}
        open={showForm}
        handleOpenChange={handleFormClose}
        editingModel={editingModel}
      />
      <TruckModelFilters
        open={showFilters}
        onOpenChange={setShowFilters}
        onApplyFilters={handleApplyFilters}
        initialFilters={filters}
      />
    </div>
  );
}

