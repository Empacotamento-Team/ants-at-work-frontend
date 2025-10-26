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
import api from "@/api/axios";

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

async function fetchFleets(): Promise<Fleet[]> {
  const response = await api.get('/fleets');
  return response.data;
}

async function createFleet(data: FleetData) {//Promise<Fleet> {
  const response = await api.post('/fleets', {...data, trucksIds: []});
  return response.data;
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
            return (
              <FleetCard
                key={fleet.id}
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
            );
          })}
        </div>
      )}
    </div>
  );
}