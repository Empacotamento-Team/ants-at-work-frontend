import { useCallback, useState } from "react";
import TruckMultiSelect from "@components/trucks/TruckMultiSelect";
import { TruckData } from "@schemas/truckSchema";
import { Button } from "@components/shadcn-ui/Button";
import { toast } from "react-toastify";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@components/shadcn-ui/Skeleton";
import { ColumnDef } from "@tanstack/react-table";
import { ViewDataTable } from "@components/trucks/ViewDataTable";
import { ArrowLeft, Pencil, Trash, Truck, Wrench, Activity, Gauge } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@components/shadcn-ui/Tooltip";
import { useParams, useNavigate } from "react-router-dom";
import FleetIndicator from "@components/trucks/FleetIndicator";
import { Badge } from "@components/shadcn-ui/Badge";
import PageHeader from "@components/PageHeader";

interface Truck extends TruckData {
  id: string;
}
interface Fleet {
  id: string;
  name: string;
  description: string;
  trucksQuantity: number;
  averageCapacity: number;
  activeTrucks: number;
  maintenanceTrucks: number;
  trucks: Truck[];
}

const statusVariantMap: { [key: string]: "default" | "secondary" | "destructive" } = {
    active: "default",
    maintenance: "secondary",
    inactive: "destructive",
};

const statusTextMap: { [key: string]: string } = {
    active: "Ativo",
    maintenance: "Em Manutenção",
    inactive: "Inativo",
};

function calculateFleetIndicators(trucks: Truck[]): Omit<Fleet, 'id' | 'name' | 'description' | 'trucks'> {
  const trucksQuantity = trucks.length;
  const activeTrucks = trucks.filter(truck => truck.status === 'active').length;
  const maintenanceTrucks = trucks.filter(truck => truck.status === 'maintenance').length;
  const averageCapacity = trucksQuantity > 0 
    ? Math.round(trucks.reduce((sum, truck) => sum + truck.maximumCapacity, 0) / trucksQuantity)
    : 0;

  return {
    trucksQuantity,
    activeTrucks,
    maintenanceTrucks,
    averageCapacity,
  };
}

const tableColumns: ColumnDef<Truck>[] = [
  { accessorKey: "plate", header: "Placa" },
  { accessorKey: "model", header: "Modelo" },
  { accessorKey: "capacity", header: "Capacidade (kg)", cell: ({ row }) => `${row.original.capacity.toLocaleString('pt-BR')} kg` },
  { accessorKey: "mileage", header: "Quilometragem", cell: ({ row }) => `${row.original.mileage.toLocaleString('pt-BR')} km` },
  { accessorKey: "lastRevision", header: "Última Revisão", cell: ({ row }) => new Date(row.original.lastRevision).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
        const status = row.original.status;
        return <Badge variant={statusVariantMap[status] || 'default'}>{statusTextMap[status] || 'Desconhecido'}</Badge>;
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
              <Button variant="outline" size="icon" className="cursor-pointer" onClick={() => console.log("Editando " + truck.id)}>
                <Pencil className="h-4 w-4"/>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Editar caminhão</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="destructive" size="icon" className="cursor-pointer">
                <Trash className="h-4 w-4"/>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Excluir caminhão</TooltipContent>
          </Tooltip>
        </div>
      );
    },
  },
];

const MOCKED_FLEETS: Fleet[] = [
    {
      id: "fleet-1",
      name: "Frota Principal - Longa Distância",
      description: "Caminhões pesados para rotas interestaduais.",
      trucksQuantity: 0,
      averageCapacity: 0,
      activeTrucks: 0,
      maintenanceTrucks: 0,
      trucks: [
        { 
          id: "truck-1", 
          plate: "ABC-1111", 
          maximumCapacity: 25000, 
          internalHeight: 3.1, 
          internalWidth: 2.6, 
          internalLength: 14.5, 
          type: "BAU", 
          status: "ACTIVE", 
          currentMileage: 150000, 
          details: "Volvo FH 540", 
          maintenanceNote: "Última revisão em 2025-08-01" 
        },
        { 
          id: "truck-2", 
          plate: "DEF-2222", 
          maximumCapacity: 27000, 
          internalHeight: 3.2, 
          internalWidth: 2.7, 
          internalLength: 15.0, 
          type: "CARRETA", 
          status: "MAINTENANCE", 
          currentMileage: 120000, 
          details: "Scania R450", 
          maintenanceNote: "Última revisão em 2025-07-15" 
        },
        { 
          id: "truck-3", 
          plate: "GHI-3333", 
          maximumCapacity: 29000, 
          internalHeight: 3.3, 
          internalWidth: 2.8, 
          internalLength: 16.0, 
          type: "BAU", 
          status: "ACTIVE", 
          currentMileage: 200000, 
          details: "Mercedes-Benz Actros", 
          maintenanceNote: "Última revisão em 2025-06-20" 
        },
      ],
    },
    {
      id: "fleet-2",
      name: "Frota Urbana - Entregas Locais",
      description: "Veículos leves para distribuição dentro da cidade.",
      trucksQuantity: 0,
      averageCapacity: 0,
      activeTrucks: 0,
      maintenanceTrucks: 0,
      trucks: [
        { 
          id: "truck-4", 
          plate: "VWX-8888", 
          maximumCapacity: 4000, 
          internalHeight: 2.5, 
          internalWidth: 2.0, 
          internalLength: 8.0, 
          type: "BAU", 
          status: "ACTIVE", 
          currentMileage: 80000, 
          details: "VW Delivery Express", 
          maintenanceNote: "Última revisão em 2025-09-01" 
        },
      ],
    },
    { 
      id: "fleet-3", 
      name: "Frota Refrigerada", 
      description: "Caminhões com baú refrigerado.", 
      trucksQuantity: 0,
      averageCapacity: 0,
      activeTrucks: 0,
      maintenanceTrucks: 0,
      trucks: [] 
    },
];

async function fetchFleetById(fleetId: string): Promise<Fleet | undefined> {
  console.log(`Buscando frota com ID: ${fleetId}`);
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const fleet = MOCKED_FLEETS.find(f => f.id === fleetId);
  if (!fleet) {
    throw new Error("Fleet not found");
  }
  
  const indicators = calculateFleetIndicators(fleet.trucks);
  
  return {
    ...fleet,
    ...indicators,
  };
}

async function handleAddTrucksToFleet(truckIds: string[]) {
  console.log("Adicionando caminhões à frota:", truckIds);
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return truckIds;
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

  const truckMutation = useMutation({
    mutationKey: ["add-trucks-to-fleet", fleetId],
    mutationFn: handleAddTrucksToFleet,
    onSuccess: (truckIds) => {
      toast.success(`${truckIds.length} caminhão(ões) adicionado(s) à frota com sucesso!`);
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['fleet', fleetId] });
    },
    onError: () => {
      toast.error("Erro ao adicionar caminhões à frota.");
    },
  });

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

  const inactiveTrucks = fleet.trucksQuantity - fleet.activeTrucks - fleet.maintenanceTrucks;

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
        <FleetIndicator cardTitle="Total de Caminhões" icon={Truck} indicatorValue={fleet.trucksQuantity}
          subtitle="veículos na frota"/>
        <FleetIndicator cardTitle="Caminhões Ativos" icon={Activity} indicatorValue={fleet.activeTrucks} specialColor="var(--color-green-600)" 
          subtitle={fleet.trucksQuantity > 0 ? `${Math.round((fleet.activeTrucks / fleet.trucksQuantity) * 100)}% da frota` : '0% da frota'}
          onClick={() => handleFilterChange('active')} active={filtering === 'active'}/>
        <FleetIndicator cardTitle="Em Manutenção" icon={Wrench} indicatorValue={fleet.maintenanceTrucks} specialColor="var(--color-yellow-600)" 
          subtitle={inactiveTrucks > 0 ? `${inactiveTrucks} inativos` : ''}
          onClick={() => handleFilterChange('maintenance')} active={filtering === 'maintenance'}/>
        <FleetIndicator cardTitle="Capacidade Média" icon={Gauge} indicatorValue={fleet.averageCapacity.toLocaleString('pt-BR')} 
          subtitle="kg por veículo"/>
      </div>
      
      <ViewDataTable columns={tableColumns} data={fleet.trucks || []} />
      
      <TruckMultiSelect
        open={showForm}
        onOpenChange={setShowForm}
        onTrucksSelected={truckMutation.mutate}
      />
    </div>
  );
}