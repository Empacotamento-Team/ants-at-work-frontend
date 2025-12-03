import { useEffect, useState, useMemo } from "react";
import TruckForm from "@components/TruckForm";
import TruckFilters from "@components/TruckFilters";
import { TruckData } from "@schemas/truckSchema";
import { Button } from "@components/button";
import { toast } from "react-toastify";
import { Truck } from "@/types/Truck";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { ViewDataTable } from "@components/trucks/ViewDataTable";
import { Pencil, Trash, Filter } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@components/shadcn-ui/Tooltip";
import { trucksApi } from "@/api/trucks";
import { truckModelsApi } from "@/api/truckModels";
import { TruckModel } from "@/types/TruckModel";
import { getFilterIconClassName } from "@/lib/utils";
import { PageHeader } from "@components/PageHeader";

const createTableColumns = (
  onEdit: (truck: Truck) => void,
  onDelete: (id: string) => void,
  modelsMap: Map<string, string>
): ColumnDef<Truck>[] => [
  {
    accessorKey: "plate",
    header: "Placa",
  },
  {
    accessorKey: "model",
    header: "Modelo",
    cell: ({ row }) => {
      const truck = row.original;
      if (truck.model?.name) {
        return truck.model.name;
      }
      if (truck.modelId && modelsMap.has(truck.modelId)) {
        return modelsMap.get(truck.modelId);
      }
      return "-";
    },
  },
  {
    accessorKey: "type",
    header: "Tipo",
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      if (type === "BAU") return "Baú";
      if (type === "CARRETA") return "Carreta";
      return type;
    },
  },
  {
    id: "dimensions",
    header: ({ column }) => {
      return (
        <button
          className="flex items-center gap-1 hover:text-[#744625] transition-colors"
          onClick={() => {
            const isAsc = column.getIsSorted() === "asc";
            column.toggleSorting(isAsc);
          }}
        >
          Dimensões (m)
          <span className="text-xs">
            {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
          </span>
        </button>
      );
    },
    accessorFn: (row) => {
      const dims = row.internalDimensions || { height: 0, width: 0, length: 0 };
      return (dims.height || 0) * (dims.length || 0) * (dims.width || 0);
    },
    cell: ({ row }) => {
      const truck = row.original;
      const dims = truck.internalDimensions || { height: 0, width: 0, length: 0 };
      return `${(dims.height || 0).toFixed(2)} x ${(dims.length || 0).toFixed(2)} x ${(dims.width || 0).toFixed(2)}`;
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
          Capacidade (kg)
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
    accessorKey: "currentMileage",
    header: ({ column }) => {
      return (
        <button
          className="flex items-center gap-1 hover:text-[#744625] transition-colors"
          onClick={() => {
            const isAsc = column.getIsSorted() === "asc";
            column.toggleSorting(isAsc);
          }}
        >
          Quilometragem
          <span className="text-xs">
            {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
          </span>
        </button>
      );
    },
    cell: ({ row }) => {
      const mileage = row.getValue("currentMileage") as number;
      return mileage ? mileage.toLocaleString('pt-BR') : "0";
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      if (status === "ACTIVE") return "Ativo";
      if (status === "MAINTENANCE") return "Manutenção";
      if (status === "INACTIVE") return "Inativo";
      return status;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const truck = row.original;
      return (
        <div className="flex gap-2 justify-end">
          <Tooltip>
            <TooltipTrigger>
              <Button variant="outline" className="cursor-pointer" onClick={() => onEdit(truck)}>
                <Pencil />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Editar caminhão</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger>
              <Button variant="destructive" className="cursor-pointer" onClick={() => onDelete(truck.id)}>
                <Trash />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Excluir caminhão</TooltipContent>
          </Tooltip>
        </div>
      );
    },
  },
];

async function fetchTrucks(page: number = 0, size: number = 8, filters?: { plate?: string; type?: string; status?: string; modelId?: string }): Promise<{ trucks: Truck[]; total: number; totalPages: number; currentPage: number; hasNext: boolean; hasPrevious: boolean }> {
  try {
    const result = await trucksApi.getAll(page, size, filters);
    return result;
  } catch (error) {
    return { trucks: [], total: 0, totalPages: 0, currentPage: 0, hasNext: false, hasPrevious: false };
  }
}

async function fetchTruckModels(): Promise<TruckModel[]> {
  try {
    const result = await truckModelsApi.getAll(0, 1000);
    return result.models || [];
  } catch {
    return [];
  }
}

async function handleAddTruck(data: TruckData) {
  return await trucksApi.create(data);
}

async function handleUpdateTruck(id: string, data: TruckData) {
  return await trucksApi.update(id, data);
}

async function handleDeleteTruck(id: string) {
  await trucksApi.delete(id);
}

type FilterData = {
  plate: string;
  type: string;
  status: string;
  modelId: string;
};

export default function TruckList() {
  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingTruck, setEditingTruck] = useState<Truck | null>(null);
  const [filters, setFilters] = useState<FilterData>({
    plate: "",
    type: "",
    status: "",
    modelId: "",
  });
  const queryClient = useQueryClient();

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(8);

  const {
    data: trucksData,
    isPending: isLoading,
    isError,
  } = useQuery<{ trucks: Truck[]; total: number; totalPages: number; currentPage: number; hasNext: boolean; hasPrevious: boolean }>({
    queryKey: ["trucks", currentPage, pageSize, filters],
    queryFn: () => fetchTrucks(currentPage, pageSize, filters),
  });

  const { data: truckModels } = useQuery<TruckModel[]>({
    queryKey: ["truckModels"],
    queryFn: fetchTruckModels,
    initialData: [],
  });

  const modelsMap = useMemo(() => {
    const map = new Map<string, string>();
    if (truckModels && Array.isArray(truckModels)) {
      truckModels.forEach(model => {
        if (model && model.id && model.name) {
          map.set(model.id, model.name);
        }
      });
    }
    return map;
  }, [truckModels]);

  const trucks = trucksData?.trucks || [];

  const truckMutation = useMutation({
    mutationKey: ["save-trucks"],
    mutationFn: editingTruck ? 
      (data: TruckData) => handleUpdateTruck(editingTruck.id, data) :
      handleAddTruck,
    onSuccess: () => {
      toast.success(editingTruck ? "Caminhão atualizado com sucesso!" : "Caminhão adicionado com sucesso!");
      setShowForm(false);
      setEditingTruck(null);
      setCurrentPage(0);
      queryClient.invalidateQueries({ queryKey: ["trucks"] });
    },
    onError: () => {
      toast.error(editingTruck ? "Erro ao atualizar caminhão. Tente novamente." : "Erro ao adicionar caminhão. Tente novamente.");
    },
  });

  const deleteMutation = useMutation({
    mutationKey: ["delete-trucks"],
    mutationFn: handleDeleteTruck,
    onSuccess: () => {
      toast.success("Caminhão excluído com sucesso!");
      setCurrentPage(0);
      queryClient.invalidateQueries({ queryKey: ["trucks"] });
    },
    onError: () => {
      toast.error("Erro ao excluir caminhão. Tente novamente.");
    },
  });

  const handleEdit = (truck: Truck) => {
    setEditingTruck(truck);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este caminhão?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleFormClose = (open: boolean) => {
    setShowForm(open);
    if (!open) {
      setEditingTruck(null);
    }
  };

  const handleApplyFilters = (newFilters: FilterData) => {
    setFilters(newFilters);
    setCurrentPage(0);
  };

  useEffect(() => {
    if (isError) {
      toast.error("Erro ao carregar caminhões");
    }
  }, [isError]);

  const tableColumns = createTableColumns(handleEdit, handleDelete, modelsMap);

  const totalPages = trucksData?.totalPages || 0;
  const totalItems = trucksData?.total || 0;
  const hasNext = currentPage < totalPages - 1;
  const hasPrevious = currentPage > 0;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage < 3) {
        for (let i = 0; i < 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages - 1);
      } else if (currentPage > totalPages - 4) {
        pages.push(0);
        pages.push("...");
        for (let i = totalPages - 4; i < totalPages; i++) {
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

  return (
    <div className="p-8">
      <PageHeader
        title={`Gerenciamento de Caminhões`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowFilters(true)}>
              <Filter className={`mr-2 h-4 w-4 ${getFilterIconClassName(filters)}`} />
              Filtros
            </Button>
            <Button onClick={() => setShowForm(true)}>Cadastrar Caminhão</Button>
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
            {isLoading ? "Carregando..." : `Mostrando ${trucks.length} de ${totalItems} registros`}
          </div>
        </div>
        <ViewDataTable columns={tableColumns} data={trucks} isLoading={isLoading} />
          
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
      <TruckForm
        onSubmit={truckMutation.mutate}
        open={showForm}
        handleOpenChange={handleFormClose}
        editingTruck={editingTruck}
      />
      <TruckFilters
        open={showFilters}
        onOpenChange={setShowFilters}
        onApplyFilters={handleApplyFilters}
        initialFilters={filters}
      />
    </div>
  );
}