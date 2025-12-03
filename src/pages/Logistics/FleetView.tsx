import { useCallback, useState, useEffect } from "react";
import TruckMultiSelect from "@components/trucks/TruckMultiSelect";
import { TruckData } from "@schemas/truckSchema";
import { Button } from "@components/shadcn-ui/Button";
import { toast } from "react-toastify";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@components/shadcn-ui/Skeleton";
import { ColumnDef } from "@tanstack/react-table";
import { ViewDataTable } from "@components/trucks/ViewDataTable";
import { ArrowLeft, Pencil, Truck as TruckIcon, Wrench, Activity, Gauge, X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@components/shadcn-ui/Tooltip";
import { useParams, useNavigate } from "react-router-dom";
import FleetIndicator from "@components/trucks/FleetIndicator";
import { Badge } from "@components/shadcn-ui/Badge";
import PageHeader from "@components/PageHeader";
import api from "@/api/axios";
import TruckForm from "@components/TruckForm";
import { trucksApi } from "@/api/trucks";
import { Truck } from "@/types/Truck";

interface Fleet {
  id: string;
  name: string;
  trucksQuantity: number;
  activeTrucks: number;
  averageCapacity: number;
  underMaintenanceTrucks: number;
  trucksSummary: TruckData[];
}

const statusVariantMap: { [key: string]: "default" | "secondary" | "destructive" } = {
    ['Ativo']: "default",
    ['Em Manutenção']: "secondary",
    ['Inativo']: "destructive",
    ACTIVE: "default",
    MAINTENANCE: "secondary",
    INACTIVE: "destructive",
};

const statusTextMap: { [key: string]: string } = {
    ACTIVE: "Ativo",
    MAINTENANCE: "Em Manutenção",
    INACTIVE: "Inativo",
};

type TruckDataWithModel = TruckData & {
  model?: {
    id: string;
    name: string;
    description: string;
    maximumCapacity: number;
    internalHeight: number;
    internalWidth: number;
    internalLength: number;
    type: "BAU" | "CARRETA" | "Baú" | "Carreta";
  } | null;
  modelId?: string | null;
};

function createTableColumns(
  handleEdit: (truck: TruckDataWithModel) => void,
  handleRemove: (id: string) => void
): ColumnDef<TruckDataWithModel>[] {
  return [
    { accessorKey: "plate", header: "Placa" },
    {
      accessorKey: "model",
      header: "Modelo",
      cell: ({ row }) => {
        const model = row.original.model;
        return model?.name || "-";
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
      cell: ({ row }) => `${row.original.maximumCapacity?.toLocaleString('pt-BR')} kg`
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
      cell: ({ row }) => `${row.original.currentMileage?.toLocaleString('pt-BR')} km`
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
          const status = row.original.status;
          const statusText = statusTextMap[status] || status || 'Desconhecido';
          return <Badge variant={statusVariantMap[status] || statusVariantMap[statusText] || 'default'}>{statusText}</Badge>;
      }
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const truck = row.original;
        return (
          <div className="flex gap-2 justify-end">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="cursor-pointer" onClick={() => handleEdit(truck)}>
                  <Pencil className="h-4 w-4"/>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Editar caminhão</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="destructive" size="icon" className="cursor-pointer" onClick={() => handleRemove((truck as any).id || '')}>
                  <X className="h-4 w-4"/>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Remover caminhão</TooltipContent>
            </Tooltip>
          </div>
        );
      },
    },
  ];
}

async function fetchFleetById(fleetId: string): Promise<Fleet | undefined> {
  const response = await api.get(`/fleets/${fleetId}`);
  return response.data;
}

async function handleAddTrucksToFleet(fleetId: string, trucksIds: string[]) {
  const trucksIdsAsNumbers = trucksIds.map(id => Number(id)).filter(id => !isNaN(id) && id > 0);
  const response = await api.post(`/fleets/${fleetId}/trucks`, { trucksIds: trucksIdsAsNumbers });
  return response.data;
}

async function handleRemoveTruckFromFleet(fleetId: string, truckId: string) {
  await api.delete(`/fleets/${fleetId}/trucks`, {
    data: { truckIds: [truckId] },
  });
}

async function fetchFleetTrucks(fleetId: string, page: number = 0, size: number = 6, status?: 'ACTIVE' | 'MAINTENANCE'): Promise<{ trucks: TruckDataWithModel[]; total: number; totalPages: number; currentPage: number; hasNext: boolean; hasPrevious: boolean }> {
  try {
    const params: any = { fleetId: Number(fleetId), page, size };
    if (status) {
      const statusMap: { [key: string]: string } = {
        'ACTIVE': 'Ativo',
        'MAINTENANCE': 'Em Manutenção',
      };
      params.status = statusMap[status] || status;
    }
    const response = await api.get(`/trucks`, { params });
    const pageData = response.data;
    const trucks: any[] = pageData?.content || [];
    const total = pageData?.totalElements || 0;
    const totalPages = pageData?.totalPages || 0;
    const currentPage = pageData?.number || 0;
    const hasNext = pageData?.hasNext || false;
    const hasPrevious = pageData?.hasPrevious || false;
    
    const typeMap: { [key: string]: "BAU" | "CARRETA" } = {
      "Baú": "BAU",
      "Carreta": "CARRETA",
      "CHEST": "BAU",
      "CART": "CARRETA",
      "BAU": "BAU",
      "CARRETA": "CARRETA",
    };
    
    const statusMap: { [key: string]: "ACTIVE" | "MAINTENANCE" | "INACTIVE" } = {
      "Ativo": "ACTIVE",
      "Em Manutenção": "MAINTENANCE",
      "Inativo": "INACTIVE",
      "AVAILABLE": "ACTIVE",
      "UNDER_MAINTENANCE": "MAINTENANCE",
      "UNAVAILABLE": "INACTIVE",
      "ACTIVE": "ACTIVE",
      "MAINTENANCE": "MAINTENANCE",
      "INACTIVE": "INACTIVE",
    };
    
    const mappedTrucks = trucks.map((truck: any) => {
      const truckType = String(truck.type || "");
      const truckStatus = String(truck.status || "");
      const model = truck.model || null;
      
      return {
        id: String(truck.id || ""),
        plate: String(truck.plate || ""),
        maximumCapacity: Number(truck.maximumCapacity || 0),
        internalHeight: Number(truck.internalHeight || 0),
        internalWidth: Number(truck.internalWidth || 0),
        internalLength: Number(truck.internalLength || 0),
        type: typeMap[truckType] || "BAU",
        status: statusMap[truckStatus] || "ACTIVE",
        currentMileage: Number(truck.currentMileage || 0),
        details: String(truck.details || ""),
        maintenanceNote: String(truck.maintenanceNote || ""),
        model: model ? {
          id: String(model.id || ""),
          name: String(model.name || ""),
          description: String(model.description || ""),
          maximumCapacity: Number(model.defaultMaximumCapacity || 0),
          internalHeight: Number(model.defaultInternalDimensions?.height || 0),
          internalWidth: Number(model.defaultInternalDimensions?.width || 0),
          internalLength: Number(model.defaultInternalDimensions?.length || 0),
          type: String(model.defaultTruckType || "") as "BAU" | "CARRETA" | "Baú" | "Carreta",
        } : null,
        modelId: model?.id ? String(model.id) : undefined,
      };
    });
    
    return { trucks: mappedTrucks, total, totalPages, currentPage, hasNext, hasPrevious };
  } catch (error: any) {
    return { trucks: [], total: 0, totalPages: 0, currentPage: 0, hasNext: false, hasPrevious: false };
  }
}

export default function FleetView() {
  const [showForm, setShowForm] = useState(false);
  const [showTruckEditForm, setShowTruckEditForm] = useState(false);
  const [editingTruck, setEditingTruck] = useState<Truck | null>(null);
  const [filtering, setFiltering] = useState<'all' | 'active' | 'maintenance'>('all');
  const [trucksCurrentPage, setTrucksCurrentPage] = useState(0);
  const [trucksPageSize, setTrucksPageSize] = useState(6);
  const { fleetId } = useParams<{ fleetId: string }>(); 
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: fleet, isPending: isLoading, isError } = useQuery<Fleet | undefined>({
    queryKey: ["fleet", fleetId], 
    queryFn: () => fetchFleetById(fleetId!),
    enabled: !!fleetId, 
    retry: false,
  });

  const { data: trucksData, isLoading: isLoadingTrucks } = useQuery<{ trucks: TruckDataWithModel[]; total: number; totalPages: number; currentPage: number; hasNext: boolean; hasPrevious: boolean }>({
    queryKey: ["fleet-trucks", fleetId, trucksCurrentPage, trucksPageSize, filtering],
    queryFn: () => {
      const status = filtering === 'active' ? 'ACTIVE' : filtering === 'maintenance' ? 'MAINTENANCE' : undefined;
      return fetchFleetTrucks(fleetId!, trucksCurrentPage, trucksPageSize, status);
    },
    enabled: !!fleetId,
    staleTime: 0,
    refetchOnMount: true,
  });

  const fleetTrucks = trucksData?.trucks || [];
  
  const trucksTotalPages = trucksData?.totalPages || 0;
  const trucksHasNext = trucksCurrentPage < trucksTotalPages - 1;
  const trucksHasPrevious = trucksCurrentPage > 0;

  const truckMutation = useMutation({
    mutationKey: ["add-trucks-to-fleet", fleetId],
    mutationFn: (trucksIds: string[]) => handleAddTrucksToFleet(fleetId!, trucksIds),
    onSuccess: () => {
      toast.success(`Caminhão(ões) adicionado(s) à frota com sucesso!`);
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['fleet', fleetId] });
      queryClient.invalidateQueries({ queryKey: ['fleet-trucks', fleetId] });
      setTrucksCurrentPage(0);
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || "Erro ao adicionar caminhões à frota.";
      toast.error(errorMessage);
    },
  });

  const removeFromFleetMutation = useMutation({
    mutationKey: ["remove-truck", fleetId],
    mutationFn: (truckId: string) => handleRemoveTruckFromFleet(fleetId!, truckId),
    onSuccess: () => {
      toast.success("Caminhão removido com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['fleet', fleetId] });
      queryClient.invalidateQueries({ queryKey: ['fleet-trucks', fleetId] });
      setTrucksCurrentPage(0);
    },
    onError: () => {
      toast.error("Erro ao remover caminhão da frota. Tente novamente.");
    },
  });

  const updateTruckMutation = useMutation({
    mutationKey: ["update-truck", fleetId],
    mutationFn: (data: { id: string; data: TruckData }) => trucksApi.update(data.id, data.data),
    onSuccess: () => {
      toast.success("Caminhão atualizado com sucesso!");
      setShowTruckEditForm(false);
      setEditingTruck(null);
      queryClient.invalidateQueries({ queryKey: ['fleet', fleetId] });
      queryClient.invalidateQueries({ queryKey: ['fleet-trucks', fleetId] });
      queryClient.invalidateQueries({ queryKey: ['trucks'] });
    },
    onError: () => {
      toast.error("Erro ao atualizar caminhão. Tente novamente.");
    },
  });


  const handleRemove = useCallback((id: string) => {
    if (window.confirm("Tem certeza que deseja remover este caminhão da frota?")) {
      removeFromFleetMutation.mutate(id);
    }
  }, [removeFromFleetMutation]);

  const handleEditTruck = useCallback((truck: TruckDataWithModel) => {
    const typeMap: { [key: string]: "BAU" | "CARRETA" } = {
      "BAU": "BAU",
      "CARRETA": "CARRETA",
      "Baú": "BAU",
      "Carreta": "CARRETA",
      "baú": "BAU",
      "carreta": "CARRETA",
    };

    const statusMap: { [key: string]: "ACTIVE" | "MAINTENANCE" | "INACTIVE" } = {
      "ACTIVE": "ACTIVE",
      "MAINTENANCE": "MAINTENANCE",
      "INACTIVE": "INACTIVE",
      "UNDER_MAINTENANCE": "MAINTENANCE",
      "AVAILABLE": "ACTIVE",
      "Ativo": "ACTIVE",
      "Em Manutenção": "MAINTENANCE",
      "Manutenção": "MAINTENANCE",
      "Inativo": "INACTIVE",
      "ativo": "ACTIVE",
      "em manutenção": "MAINTENANCE",
      "manutenção": "MAINTENANCE",
      "inativo": "INACTIVE",
    };

    const mappedType = typeMap[truck.type || ""] || "BAU";
    const mappedStatus = statusMap[truck.status || ""] || "ACTIVE";

    const truckToEdit: Truck = {
      id: (truck as any).id || '',
      plate: truck.plate || '',
      maximumCapacity: truck.maximumCapacity || 0,
      internalDimensions: {
        height: (truck as any).internalHeight || (truck as any).internalDimensions?.height || 0,
        width: (truck as any).internalWidth || (truck as any).internalDimensions?.width || 0,
        length: (truck as any).internalLength || (truck as any).internalDimensions?.length || 0
      },
      type: mappedType,
      status: mappedStatus,
      currentMileage: truck.currentMileage || 0,
      details: truck.details || '',
      maintenanceNote: truck.maintenanceNote || '',
    };
    setEditingTruck(truckToEdit);
    setShowTruckEditForm(true);
  }, []);

  const handleTruckFormClose = useCallback((open: boolean) => {
    setShowTruckEditForm(open);
    if (!open) {
      setEditingTruck(null);
    }
  }, []);

  const handleTruckFormSubmit = useCallback((data: TruckData) => {
    if (!editingTruck || !editingTruck.id) {
      toast.error("Erro: ID do caminhão não encontrado.");
      return;
    }
    updateTruckMutation.mutate({ id: editingTruck.id, data });
  }, [editingTruck, updateTruckMutation]);

  const handleFilterChange = useCallback((filterMode: 'active' | 'maintenance') => {
    if (filtering === filterMode) {
      setFiltering('all');
    } else {
      setFiltering(filterMode);
    }
  }, [filtering]);



  const tableColumns = createTableColumns(
    handleEditTruck,
    (id) => handleRemove(id)
  );

  useEffect(() => {
    setTrucksCurrentPage(0);
  }, [filtering]);


  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="w-full h-[40vh]" />
      </div>
    );
  }

  if (isError || !fleet) {
    return (
        <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
            <p className="text-xl text-muted-foreground">Frota não encontrada.</p>
            <Button onClick={() => navigate("/fleets")}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Frotas
            </Button>
        </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-4">
        <Button onClick={() => navigate("/fleets")} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
      </div>

      <PageHeader
        title={`${fleet.name}`}
        actions={<Button onClick={() => setShowForm(true)}>Adicionar Caminhão</Button>}
        topClass="top-11"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <FleetIndicator cardTitle="Total de Caminhões" icon={TruckIcon} indicatorValue={fleet.trucksQuantity}
          subtitle="veículos na frota"/>
        <FleetIndicator cardTitle="Caminhões Ativos" icon={Activity} indicatorValue={fleet.activeTrucks} specialColor="var(--color-green-600)" 
          subtitle={fleet.trucksQuantity > 0 ? `${Math.round((fleet.activeTrucks / fleet.trucksQuantity) * 100)}% da frota` : '0% da frota'}
          onClick={() => handleFilterChange('active')} active={filtering === 'active'}/>
        <FleetIndicator cardTitle="Em Manutenção" icon={Wrench} indicatorValue={fleet.underMaintenanceTrucks} specialColor="var(--color-yellow-600)" 
          subtitle={fleet.trucksQuantity > 0 ? `${Math.round((fleet.underMaintenanceTrucks / fleet.trucksQuantity) * 100)}% da frota` : '0% da frota'}
          onClick={() => handleFilterChange('maintenance')} active={filtering === 'maintenance'}/>
        <FleetIndicator cardTitle="Capacidade Média" icon={Gauge} indicatorValue={fleet.averageCapacity?.toLocaleString('pt-BR')} 
          subtitle="kg por veículo"/>
      </div>
      
      <ViewDataTable columns={tableColumns} data={fleetTrucks || []} isLoading={isLoadingTrucks} />
      {!isLoadingTrucks && fleetTrucks.length > 0 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  const newPage = Math.max(0, trucksCurrentPage - 1);
                  setTrucksCurrentPage(newPage);
                }}
                disabled={!trucksHasPrevious}
                className="px-4"
              >
                Anterior
              </Button>
              <span className="text-sm text-[#4C2D2D]">
                Página {trucksCurrentPage + 1} de {trucksTotalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => {
                  if (trucksTotalPages > 0) {
                    const newPage = Math.min(trucksTotalPages - 1, trucksCurrentPage + 1);
                    setTrucksCurrentPage(newPage);
                  }
                }}
                disabled={!trucksHasNext || trucksTotalPages === 0}
                className="px-4"
              >
                Próximo
              </Button>
              <div className="flex items-center gap-2 ml-4">
                <label htmlFor="trucksPageSize" className="text-sm text-[#4C2D2D]">
                  Por página:
                </label>
                <input
                  id="trucksPageSize"
                  type="number"
                  min="1"
                  value={trucksPageSize}
                  onChange={(e) => {
                    const newSize = Math.max(1, parseInt(e.target.value) || 6);
                    setTrucksPageSize(newSize);
                    setTrucksCurrentPage(0);
                  }}
                  className="w-20 p-2 rounded-lg border-2 border-[#CABAAE] bg-[#E5DAD1] text-[#3F2323] text-sm focus:outline-none focus:ring-2 focus:ring-[#744625]"
                />
              </div>
            </div>
          )}

      <TruckMultiSelect
        open={showForm}
        onOpenChange={setShowForm}
        onTrucksSelected={truckMutation.mutate}
      />

      <TruckForm
        open={showTruckEditForm}
        handleOpenChange={handleTruckFormClose}
        onSubmit={handleTruckFormSubmit}
        editingTruck={editingTruck}
      />
    </div>
  );
}
