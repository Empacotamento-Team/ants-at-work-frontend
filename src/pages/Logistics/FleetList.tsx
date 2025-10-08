import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import FleetCard from "@components/trucks/FleetCard";
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
import { Loader2 } from "lucide-react";
import PageHeader from "@components/PageHeader";

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
  description: string;
  trucks: Truck[];
}

const MOCKED_FLEETS: Fleet[] = [
  {
    id: "fleet-1",
    name: "Frota Principal - Longa Distância",
    description: "Caminhões pesados para rotas interestaduais.",
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
  { id: "fleet-3", name: "Frota Refrigerada", description: "Caminhões com baú refrigerado.", trucks: [] },
];

async function fetchFleets(): Promise<Fleet[]> {
  console.log("Buscando frotas...");
  await new Promise((resolve) => setTimeout(resolve, 800)); 
  return JSON.parse(JSON.stringify(MOCKED_FLEETS)); 
}

async function createFleet(data: FleetData): Promise<Fleet> {
  console.log("Salvando nova frota:", data);
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const newFleet: Fleet = {
    id: `fleet-${Date.now()}`,
    name: data.name,
    description: data.description,
    trucks: [],
  };
  MOCKED_FLEETS.push(newFleet); 
  return newFleet;
}


export default function FleetList() {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: fleets, isLoading: loadingFleets } = useQuery<Fleet[]>({
    queryKey: ["fleets"],
    queryFn: fetchFleets,
  });

  const addFleetMutation = useMutation({
    mutationFn: createFleet,
    onSuccess: () => {
      toast.success("Frota adicionada com sucesso!");
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["fleets"] });
    },
    onError: () => {
      toast.error("Erro ao adicionar frota.");
    },
  });

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FleetData>({
    resolver: zodResolver(FleetSchema),
  });

  const handleFormSubmit = (data: FleetData) => {
    addFleetMutation.mutate(data);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      reset(); 
    }
    setShowForm(open);
  };

  return (
    <div className="container mx-auto p-8 md:p-8">
      <PageHeader
        title="Gerenciamento de Frotas"
        actions={<Button onClick={() => setShowForm(true)}>Criar Frota</Button>}
        topClass="top-11"
      />

      <Dialog open={showForm} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adicionar Nova Frota</DialogTitle>
            <DialogDescription>
              Preencha os detalhes abaixo para criar uma nova frota.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 pt-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">Nome da Frota</label>
              <Input id="name" {...register("name")} placeholder="Ex: Frota Sudeste" />
              {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1">Descrição</label>
              <Input id="description" {...register("description")} placeholder="Ex: Caminhões para entregas na região..." />
              {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>}
            </div>
            <DialogFooter>
              <Button type="submit" disabled={addFleetMutation.isPending}>
                {addFleetMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Frota
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
        <div className="space-y-6">
          {fleets?.map((fleet) => {
            const trucksQuantity = fleet.trucks.length;
            const activeTrucks = fleet.trucks.filter((t) => t.status === "ACTIVE").length;
            const maintenanceTrucks = fleet.trucks.filter((t) => t.status === "MAINTENANCE").length;
            const averageCapacity = trucksQuantity > 0 ? Math.round(fleet.trucks.reduce((sum, t) => sum + t.maximumCapacity, 0) / trucksQuantity) : 0;

            return (
              <FleetCard
                key={fleet.id}
                fleetId={fleet.id}
                name={fleet.name}
                trucks={fleet.trucks.map((t) => ({
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
                trucksQuantity={trucksQuantity}
                averageCapacity={averageCapacity}
                activeTrucks={activeTrucks}
                maintenanceTrucks={maintenanceTrucks}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}