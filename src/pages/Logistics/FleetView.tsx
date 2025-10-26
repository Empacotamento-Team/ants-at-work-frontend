import { useCallback, useState } from "react";
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
};

const statusTextMap: { [key: string]: string } = {
    active: "Ativo",
    maintenance: "Em Manutenção",
    inactive: "Inativo",
};

function createTableColumns(
  handleEdit: (truck: Truck) => void,
  handleRemove: (id: string) => void
): ColumnDef<Truck>[] {
  return [
    { accessorKey: "plate", header: "Placa" },
    { accessorKey: "model", header: "Modelo" },
    { accessorKey: "capacity", header: "Capacidade (kg)", cell: ({ row }) => `${row.original.maximumCapacity?.toLocaleString('pt-BR')} kg` },
    { accessorKey: "mileage", header: "Quilometragem", cell: ({ row }) => `${row.original.currentMileage?.toLocaleString('pt-BR')} km` },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
          const status = row.original.status;
          return <Badge variant={statusVariantMap[status] || 'default'}>{status || 'Desconhecido'}</Badge>;
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
                <Button variant="destructive" size="icon" className="cursor-pointer" onClick={() => handleRemove(truck.id)}>
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
  const response = await api.post(`/fleets/${fleetId}/trucks`, { trucksIds });
  return response.data;
}

async function handleRemoveTruckFromFleet(fleetId: string, truckId: string) {
  await api.delete(`/fleets/${fleetId}/trucks`, {
    data: { truckIds: [truckId] },
  });
}

async function fetchFleetTrucks(fleetId: string, filter: 'all' | 'active' | 'maintenance'): Promise<TruckData[]> {
  const response = await api.get(`/trucks?fleetId=${fleetId}&status=${filter === 'all' ? '' : statusTextMap[filter]}`);
  return response.data;
}

export default function FleetView() {
  const [showForm, setShowForm] = useState(false);
  const [filtering, setFiltering] = useState<'all' | 'active' | 'maintenance'>('all');
  const { fleetId } = useParams<{ fleetId: string }>(); 
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: fleet, isPending: isLoading, isError } = useQuery<Fleet | undefined>({
    queryKey: ["fleet", fleetId], 
    queryFn: () => fetchFleetById(fleetId!),
    enabled: !!fleetId, 
    retry: false,
  });

  const { data: fleetTrucks } = useQuery<TruckData[]>({
    queryKey: ["fleet-trucks", fleetId, filtering],
    queryFn: () => fetchFleetTrucks(fleetId!, filtering),
  });

  const truckMutation = useMutation({
    mutationKey: ["add-trucks-to-fleet", fleetId],
    mutationFn: (trucksIds: string[]) => handleAddTrucksToFleet(fleetId!, trucksIds),
    onSuccess: () => {
      toast.success(`Caminhão(ões) adicionado(s) à frota com sucesso!`);
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['fleet', fleetId] });
      queryClient.invalidateQueries({ queryKey: ['fleet-trucks', fleetId, filtering] })
    },
    onError: () => {
      toast.error("Erro ao adicionar caminhões à frota.");
    },
  });

  const removeFromFleetMutation = useMutation({
    mutationKey: ["remove-truck", fleetId],
    mutationFn: (truckId: string) => handleRemoveTruckFromFleet(fleetId!, truckId),
    onSuccess: () => {
      toast.success("Caminhão removido com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['fleet', fleetId] });
      queryClient.invalidateQueries({ queryKey: ['fleet-trucks', fleetId, filtering] })
    },
    onError: () => {
      toast.error("Erro ao remover caminhão da frota. Tente novamente.");
    },
  });

  const handleRemove = useCallback((id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este caminhão?")) {
      removeFromFleetMutation.mutate(id);
    }
  }, [removeFromFleetMutation]);

  const handleFilterChange = useCallback((filterMode: 'active' | 'maintenance') => {
    if (filtering === filterMode) {
      setFiltering('all');
      return;
    }
    setFiltering(filterMode);
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

  const tableColumns = createTableColumns(
    (truck) => console.log("Editando " + truck.id),
    (id) => handleRemove(id)
  );

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
          //subtitle={inactiveTrucks > 0 ? `${inactiveTrucks} inativos` : ''}
          onClick={() => handleFilterChange('maintenance')} active={filtering === 'maintenance'}/>
        <FleetIndicator cardTitle="Capacidade Média" icon={Gauge} indicatorValue={fleet.averageCapacity?.toLocaleString('pt-BR')} 
          subtitle="kg por veículo"/>
      </div>
      
      <ViewDataTable columns={tableColumns} data={fleetTrucks || []} />
      
      <TruckMultiSelect
        open={showForm}
        onOpenChange={setShowForm}
        onTrucksSelected={truckMutation.mutate}
      />
    </div>
  );
}