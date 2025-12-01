import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import FleetCard from "@components/trucks/FleetCard";
import FleetFilters from "@components/FleetFilters";
import { Button } from "@components/shadcn-ui/Button";
import { Skeleton } from "@components/shadcn-ui/Skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@components/shadcn-ui/Dialog";
import { Input } from "@components/shadcn-ui/Input";
import { FleetSchema, FleetData } from "@schemas/FleetSchema";
import { Loader2, Filter } from "lucide-react";
import PageHeader from "@components/PageHeader";
import api from "@/api/axios";
import { getFilterIconClassName } from "@/lib/utils";

interface Truck {
  id: string;
  plate: string;
  maximumCapacity: number;
  internalHeight: number;
  internalWidth: number;
  internalLength: number;
  type: "BAU" | "CARRETA";
  status: "ACTIVE" | "MAINTENANCE" | "INACTIVE";
  currentMileage: number;
  details: string;
  maintenanceNote: string;
}

interface Fleet {
  id: string;
  name: string;
  trucksQuantity: number;
  averageCapacity: number;
  activeTrucks: number;
  underMaintenanceTrucks: number;
  trucksSummary: Truck[];
}

async function fetchFleets(page: number, size: number, filters?: { name?: string; truckPlate?: string }) {
  try {
    const params: any = { page, size };
    
    if (filters) {
      if (filters.name && filters.name.trim() !== "") {
        params.name = filters.name.trim();
      }
      if (filters.truckPlate && filters.truckPlate.trim() !== "") {
        params.truckPlate = filters.truckPlate.trim();
      }
    }
    
    const response = await api.get('/fleets', { params });
    const pageData = response.data;
    const fleets: any[] = pageData?.content || [];
    const total = pageData?.totalElements || 0;
    const totalPages = pageData?.totalPages || 0;
    const currentPage = pageData?.number || 0;
    const hasNext = pageData?.hasNext || false;
    const hasPrevious = pageData?.hasPrevious || false;
    
    return { fleets, total, totalPages, currentPage, hasNext, hasPrevious };
  } catch {
    return { fleets: [], total: 0, totalPages: 0, currentPage: 0, hasNext: false, hasPrevious: false };
  }
}

async function fetchFleetById(id: string): Promise<any> {
  const response = await api.get(`/fleets/${id}`);
  return response.data;
}

async function createFleet(data: FleetData): Promise<Fleet> {
  const response = await api.post('/fleets', {...data, trucksIds: []});
  return response.data;
}

async function updateFleet(id: string, data: FleetData): Promise<Fleet> {
  const response = await api.put(`/fleets/${id}`, {
    id: Number(id),
    name: data.name,
    code: data.code,
    placeOfOperation: data.description,
    trucksIds: null,
  });
  return response.data;
}

async function deleteFleet(id: string): Promise<void> {
  await api.delete(`/fleets/${id}`);
}

type FilterData = {
  name: string;
  truckPlate: string;
};

export default function FleetList() {
  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingFleet, setEditingFleet] = useState<Fleet | null>(null);
  const [filters, setFilters] = useState<FilterData>({
    name: "",
    truckPlate: "",
  });
  const queryClient = useQueryClient();

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(2);

  const { data: fleetsData, isLoading: loadingFleets } = useQuery<{ fleets: Fleet[]; total: number; totalPages: number; currentPage: number; hasNext: boolean; hasPrevious: boolean }>({
    queryKey: ["fleets", currentPage, pageSize, filters],
    queryFn: () => fetchFleets(currentPage, pageSize, filters),
  });

  const fleets = fleetsData?.fleets || [];

  const addFleetMutation = useMutation({
    mutationFn: createFleet,
    onSuccess: () => {
      toast.success("Frota adicionada com sucesso!");
      setShowForm(false);
      setEditingFleet(null);
      setCurrentPage(0);
      queryClient.invalidateQueries({ queryKey: ["fleets"] });
    },
    onError: () => {
      toast.error("Erro ao adicionar frota.");
    },
  });

  const updateFleetMutation = useMutation({
    mutationFn: (data: FleetData) => updateFleet(editingFleet!.id, data),
    onSuccess: () => {
      toast.success("Frota atualizada com sucesso!");
      setShowForm(false);
      setEditingFleet(null);
      setCurrentPage(0);
      queryClient.invalidateQueries({ queryKey: ["fleets"] });
    },
    onError: () => {
      toast.error("Erro ao atualizar frota.");
    },
  });

  const deleteFleetMutation = useMutation({
    mutationFn: deleteFleet,
    onSuccess: () => {
      toast.success("Frota excluída com sucesso!");
      setCurrentPage(0);
      queryClient.invalidateQueries({ queryKey: ["fleets"] });
    },
    onError: () => {
      toast.error("Erro ao excluir frota.");
    },
  });

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FleetData>({
    resolver: zodResolver(FleetSchema),
  });

  const handleFormSubmit = (data: FleetData) => {
    if (editingFleet) {
      updateFleetMutation.mutate(data);
    } else {
      addFleetMutation.mutate(data);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      reset();
      setEditingFleet(null);
    }
    setShowForm(open);
  };

  const handleEdit = async (fleet: Fleet) => {
    try {
      const fullFleet = await fetchFleetById(fleet.id);
      setEditingFleet(fleet);
      reset({
        name: fullFleet.name || fleet.name,
        code: fullFleet.code || "",
        description: fullFleet.placeOfOperation || fullFleet.description || "",
      });
      setShowForm(true);
    } catch (error) {
      setEditingFleet(fleet);
      reset({
        name: fleet.name,
        code: "",
        description: "",
      });
      setShowForm(true);
    }
  };

  const handleDelete = (fleetId: string, fleetName: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a frota "${fleetName}"?`)) {
      deleteFleetMutation.mutate(fleetId);
    }
  };

  const handleApplyFilters = (newFilters: FilterData) => {
    setFilters(newFilters);
    setCurrentPage(0);
  };

  const totalItems = fleetsData?.total || 0;
  const totalPages = fleetsData?.totalPages || 0;
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
    const newSize = parseInt(e.target.value) || 2;
    if (newSize > 0) {
      setPageSize(newSize);
      setCurrentPage(0);
    }
  };

  useEffect(() => {
    setCurrentPage(0);
  }, [filters, pageSize]);

  return (
    <div className="container mx-auto p-8 md:p-8">
      <PageHeader
        title="Gerenciamento de Frotas"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowFilters(true)}>
              <Filter className={`mr-2 h-4 w-4 ${getFilterIconClassName(filters)}`} />
              Filtros
            </Button>
            <Button onClick={() => setShowForm(true)}>Criar Frota</Button>
          </div>
        }
        topClass="top-11"
      />

      <Dialog open={showForm} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingFleet ? "Editar Frota" : "Adicionar Nova Frota"}</DialogTitle>
            <DialogDescription>
              {editingFleet ? "Atualize os detalhes da frota." : "Preencha os detalhes abaixo para criar uma nova frota."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 pt-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">Nome da Frota</label>
              <Input id="name" {...register("name")} placeholder="Ex: Frota Sudeste" />
              {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label htmlFor="code" className="block text-sm font-medium mb-1">Código</label>
              <Input id="code" {...register("code")} placeholder="Ex: FRT-001" />
              {errors.code && <p className="text-sm text-red-500 mt-1">{errors.code.message}</p>}
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1">Descrição</label>
              <Input id="description" {...register("description")} placeholder="Ex: Caminhões para entregas na região..." />
              {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>}
            </div>
            <DialogFooter>
              <Button type="submit" disabled={addFleetMutation.isPending || updateFleetMutation.isPending}>
                {(addFleetMutation.isPending || updateFleetMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingFleet ? "Atualizar Frota" : "Salvar Frota"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {loadingFleets ? (
        <div className="space-y-6">
          <Skeleton className="w-full h-[220px] rounded-lg" />
          <Skeleton className="w-full h-[220px] rounded-lg" />
        </div>
      ) : (
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
              Mostrando {fleets.length} de {totalItems} registros
            </div>
          </div>
          <div className="space-y-6">
            {fleets?.map((fleet) => {
            return (
              <div key={fleet.id} className="relative">
                <FleetCard
                  fleetId={fleet.id}
                  name={fleet.name}
                  trucks={fleet.trucksSummary?.map((t) => ({
                    plate: t.plate,
                    maximumCapacity: t.maximumCapacity,
                    internalHeight: t.internalHeight,
                    internalWidth: t.internalWidth,
                    internalLength: t.internalLength,
                    type: t.type,
                    status: t.status,
                    currentMileage: t.currentMileage,
                    details: t.details,
                    maintenanceNote: t.maintenanceNote,
                  }))}
                  trucksQuantity={fleet.trucksQuantity}
                  averageCapacity={fleet.averageCapacity}
                  activeTrucks={fleet.activeTrucks}
                  maintenanceTrucks={fleet.underMaintenanceTrucks}
                />
                <div className="absolute top-4 right-4 flex gap-2 z-10">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(fleet);
                    }}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(fleet.id, fleet.name);
                    }}
                    disabled={deleteFleetMutation.isPending}
                  >
                    {deleteFleetMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Remover"}
                  </Button>
                </div>
              </div>
            );
          })}
          </div>
          
          {totalPages > 1 && (
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
                      disabled={loadingFleets}
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
          
          <div className="mt-2 text-center text-sm text-[#4C2D2D]">
            Página {currentPage + 1} de {totalPages || 1}
          </div>
        </>
      )}
      <FleetFilters
        open={showFilters}
        onOpenChange={setShowFilters}
        onApplyFilters={handleApplyFilters}
        initialFilters={filters}
      />
    </div>
  );
}
