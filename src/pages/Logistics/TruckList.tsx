import { useEffect, useState } from "react";
import TruckForm from "@components/TruckForm";
import { TruckData } from "@schemas/truckSchema";
import { Button } from "@components/button";
import { toast } from "react-toastify";
import { Truck } from "@/types/Truck";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@components/shadcn-ui/Skeleton";
import { ColumnDef } from "@tanstack/react-table";
import { ViewDataTable } from "@components/trucks/ViewDataTable";
import { Pencil, Trash } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@components/shadcn-ui/Tooltip";
import { trucksApi } from "@/api/trucks";
import { PageHeader } from "@components/PageHeader";

const createTableColumns = (
  onEdit: (truck: Truck) => void,
  onDelete: (id: string) => void
): ColumnDef<Truck>[] => [
  {
    accessorKey: "plate",
    header: "Placa",
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
    accessorKey: "maximumCapacity",
    header: "Capacidade (kg)",
  },
  {
    accessorKey: "currentMileage",
    header: "Quilometragem",
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

async function fetchTrucks(): Promise<Truck[]> {
  try {
    const trucks = await trucksApi.getAll();
    console.log("Fetched trucks:", trucks);
    
    // Se não há trucks, retornar array vazio
    if (!trucks || trucks.length === 0) {
      return [];
    }
    
    // Garantir que todos os trucks tenham o campo id e tipos corretos
    return trucks.map((truck, index) => ({
      id: (truck as any).id || `truck-${index + 1}`,
      plate: truck.plate || "",
      maximumCapacity: truck.maximumCapacity || 0,
      internalHeight: truck.internalHeight || 0,
      internalWidth: truck.internalWidth || 0,
      internalLength: truck.internalLength || 0,
      type: (truck.type as "BAU" | "CARRETA") || "BAU",
      status: (truck.status as "ACTIVE" | "MAINTENANCE" | "INACTIVE") || "ACTIVE",
      currentMileage: truck.currentMileage || 0,
      details: truck.details || "",
      maintenanceNote: truck.maintenanceNote || ""
    }));
  } catch (error) {
    console.error("Error fetching trucks:", error);
    return [];
  }
}

async function handleAddTruck(data: TruckData) {
  console.log("handleAddTruck called with data:", data);
  try {
    const result = await trucksApi.create(data);
    console.log("Truck created successfully:", result);
    return result;
  } catch (error) {
    console.error("Error creating truck:", error);
    throw error;
  }
}

async function handleUpdateTruck(id: string, data: TruckData) {
  return await trucksApi.update(id, data);
}

async function handleDeleteTruck(id: string) {
  await trucksApi.delete(id);
}

export default function TruckList() {
  const [showForm, setShowForm] = useState(false);
  const [editingTruck, setEditingTruck] = useState<Truck | null>(null);
  const queryClient = useQueryClient();

  const {
    data: trucks,
    isPending: isLoading,
    isError,
  } = useQuery<Truck[]>({
    queryKey: ["trucks"],
    queryFn: fetchTrucks,
  });

  const truckMutation = useMutation({
    mutationKey: ["save-trucks"],
    mutationFn: editingTruck ? 
      (data: TruckData) => handleUpdateTruck(editingTruck.id, data) :
      handleAddTruck,
    onSuccess: () => {
      toast.success(editingTruck ? "Caminhão atualizado com sucesso!" : "Caminhão adicionado com sucesso!");
      setShowForm(false);
      setEditingTruck(null);
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

  useEffect(() => {
    if (isError) {
      toast.error("Erro ao carregar caminhões");
    }
  }, [isError]);

  const tableColumns = createTableColumns(handleEdit, handleDelete);

  return (
    <div className="p-8">
      <PageHeader
        title={`Gerenciamento de Caminhões`}
        actions={<Button onClick={() => setShowForm(true)}>Cadastrar Caminhão</Button>}
        topClass="top-11"
      />
      {isLoading ? (
        <Skeleton className="w-full h-[60vh] mb-2" />
      ) : (
        <ViewDataTable columns={tableColumns} data={trucks || []} />
      )}
      <TruckForm
        onSubmit={truckMutation.mutate}
        open={showForm}
        handleOpenChange={handleFormClose}
        editingTruck={editingTruck}
      />
    </div>
  );
}