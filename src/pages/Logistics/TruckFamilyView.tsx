import { useCallback, useState } from "react";
import TruckMultiSelect from "@components/trucks/TruckMultiSelect";
import { TruckData } from "@schemas/truckSchema";
import { Button } from "@components/shadcn-ui/Button";
import { toast } from "react-toastify";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@components/shadcn-ui/Skeleton";
import { ColumnDef } from "@tanstack/react-table";
import { ViewDataTable } from "@components/trucks/ViewDataTable";
import { ArrowLeft, Pencil, X, Scale } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@components/shadcn-ui/Tooltip";
import { useParams, useNavigate } from "react-router-dom";
import { Badge } from "@components/shadcn-ui/Badge";
import PageHeader from "@components/PageHeader";
import api from "@/api/axios";
import { Truck } from "@/types/Truck";

interface TruckFamily {
  id: string;
  name: string;
  description: string;
  defaultMaxSupportedWeight: number;
}

const statusVariantMap: Record<string, "default" | "secondary" | "destructive"> = {
  ["Ativo"]: "default",
  ["Em Manutenção"]: "secondary",
  ["Inativo"]: "destructive",
};

const apiToTruckStatusMap: Record<string, Truck["status"]> = {
  Ativo: "ACTIVE",
  "Em Manutenção": "MAINTENANCE",
  Inativo: "INACTIVE",
};

function createTableColumns(
  handleEdit: (truck: Truck) => void,
  handleRemove: (id: string) => void
): ColumnDef<Truck>[] {
  return [
    { accessorKey: "plate", header: "Placa" },
    { accessorKey: "model", header: "Modelo" },
    {
      accessorKey: "maximumCapacity",
      header: "Capacidade (kg)",
      cell: ({ row }) =>
        `${row.original.maximumCapacity?.toLocaleString("pt-BR")} kg`,
    },
    {
      accessorKey: "currentMileage",
      header: "Quilometragem",
      cell: ({ row }) =>
        `${row.original.currentMileage?.toLocaleString("pt-BR")} km`,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge
            variant={
              status === "ACTIVE"
                ? "default"
                : status === "MAINTENANCE"
                ? "secondary"
                : "destructive"
            }
          >
            {status}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const truck = row.original;
        return (
          <div className="flex gap-2 justify-end">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleEdit(truck)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Editar caminhão</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => handleRemove(truck.plate)}
                >
                  <X className="h-4 w-4" />
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

// --- API ---
async function fetchTruckFamilyById(familyId: string): Promise<TruckFamily> {
  const response = await api.get(`/truck-families/${familyId}`);
  return response.data;
}

async function fetchFamilyTrucks(familyId: string): Promise<TruckData[]> {
  const response = await api.get(`/trucks?familyId=${familyId}`);
  return response.data;
}

async function addTrucksToFamily(familyId: string, truckIds: string[]) {
  const response = await api.post(`/truck-families/${familyId}/trucks`, {
    truckIds,
  });
  return response.data;
}

async function removeTruckFromFamily(familyId: string, truckId: string) {
  await api.delete(`/truck-families/${familyId}/trucks`, {
    data: { truckIds: [truckId] },
  });
}

// --- Componente ---
export default function TruckFamilyView() {
  const [showForm, setShowForm] = useState(false);
  const { familyId } = useParams<{ familyId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: family, isLoading, isError } = useQuery<TruckFamily>({
    queryKey: ["truck-family", familyId],
    queryFn: () => fetchTruckFamilyById(familyId!),
    enabled: !!familyId,
  });

  const { data: familyTrucks } = useQuery<TruckData[]>({
    queryKey: ["family-trucks", familyId],
    queryFn: () => fetchFamilyTrucks(familyId!),
    enabled: !!familyId,
  });

  const addTruckMutation = useMutation({
    mutationFn: (truckIds: string[]) => addTrucksToFamily(familyId!, truckIds),
    onSuccess: () => {
      toast.success("Caminhão(ões) adicionados à família!");
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["family-trucks", familyId] });
    },
    onError: () => toast.error("Erro ao adicionar caminhões."),
  });

  const removeTruckMutation = useMutation({
    mutationFn: (truckId: string) => removeTruckFromFamily(familyId!, truckId),
    onSuccess: () => {
      toast.success("Caminhão removido da família!");
      queryClient.invalidateQueries({ queryKey: ["family-trucks", familyId] });
    },
    onError: () => toast.error("Erro ao remover caminhão."),
  });

  const handleRemove = useCallback(
    (plate: string) => {
      if (window.confirm("Deseja remover este caminhão da família?")) {
        removeTruckMutation.mutate(plate);
      }
    },
    [removeTruckMutation]
  );

  const mappedTrucks: Truck[] =
    familyTrucks?.map((t) => ({
      plate: t.plate,
      maximumCapacity: t.maximumCapacity,
      currentMileage: t.currentMileage,
      internalHeight: t.internalHeight,
      internalWidth: t.internalWidth,
      internalLength: t.internalLength,
      type: t.type === "BAU" || t.type === "CARRETA" ? t.type : "BAU",
      status: apiToTruckStatusMap[t.status] || "INACTIVE",
      details: t.details || "",
      maintenanceNote: t.maintenanceNote || "",
    })) || [];

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96 mb-6" />
        <Skeleton className="w-full h-[40vh]" />
      </div>
    );
  }

  if (isError || !family) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
        <p className="text-xl text-muted-foreground">
          Família de caminhões não encontrada.
        </p>
        <Button onClick={() => navigate("/truck-families")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
      </div>
    );
  }

  const tableColumns = createTableColumns(
    (truck) => console.log("Editar caminhão", truck.plate),
    handleRemove
  );

  return (
    <div className="p-8">
      <div className="mb-4">
        <Button onClick={() => navigate("/truck-families")} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
      </div>

      <PageHeader
        title={family.name}
        description={family.description}
        actions={<Button onClick={() => setShowForm(true)}>Adicionar Caminhão</Button>}
      />

      <div className="my-6 p-4 border rounded-lg flex items-center gap-3 bg-muted/40">
        <Scale className="h-6 w-6 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          Capacidade padrão da família:{" "}
          <strong>{family.defaultMaxSupportedWeight?.toLocaleString("pt-BR")} kg</strong>
        </span>
      </div>

      <ViewDataTable<Truck, any> columns={tableColumns} data={mappedTrucks} />

      <TruckMultiSelect
        open={showForm}
        onOpenChange={setShowForm}
        onTrucksSelected={addTruckMutation.mutate}
      />
    </div>
  );
}
