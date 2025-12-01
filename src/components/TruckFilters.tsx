import { useQuery } from "@tanstack/react-query";
import FilterModal, { FilterConfig } from "./FilterModal";
import { truckModelsApi } from "@/api/truckModels";
import { TruckModel } from "@/types/TruckModel";

type FilterData = {
  plate: string;
  type: string;
  status: string;
  modelId: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyFilters: (filters: FilterData) => void;
  initialFilters: FilterData;
};

async function fetchTruckModels(): Promise<TruckModel[]> {
  try {
    const result = await truckModelsApi.getAll(0, 1000);
    return result.models || [];
  } catch {
    return [];
  }
}

export default function TruckFilters({ open, onOpenChange, onApplyFilters, initialFilters }: Props) {
  const { data: models, isLoading } = useQuery<TruckModel[]>({
    queryKey: ["truckModels", "filters"],
    queryFn: fetchTruckModels,
    initialData: [],
  });

  const modelOptions = [
    { value: "", label: "Todos os modelos" },
    ...(Array.isArray(models) ? models : []).map(model => ({
      value: model.id,
      label: model.name,
    })),
  ];

  const filterConfig: FilterConfig<FilterData> = {
    title: "Filtrar Caminhões",
    description: "Use os campos abaixo para filtrar a lista de caminhões.",
    defaultValues: {
      plate: "",
      type: "",
      status: "",
      modelId: "",
    },
    fields: [
      {
        type: "text",
        id: "plate",
        label: "Placa",
        placeholder: "Filtrar por placa...",
      },
      {
        type: "select",
        id: "type",
        label: "Tipo",
        options: [
          { value: "", label: "Todos os tipos" },
          { value: "BAU", label: "Baú" },
          { value: "CARRETA", label: "Carreta" },
        ],
      },
      {
        type: "select",
        id: "status",
        label: "Status",
        options: [
          { value: "", label: "Todos os status" },
          { value: "ACTIVE", label: "Ativo" },
          { value: "MAINTENANCE", label: "Em Manutenção" },
          { value: "INACTIVE", label: "Inativo" },
        ],
      },
      {
        type: "asyncSelect",
        id: "modelId",
        label: "Modelo",
        options: modelOptions,
        isLoading,
      },
    ],
  };

  return (
    <FilterModal
      open={open}
      onOpenChange={onOpenChange}
      onApplyFilters={onApplyFilters}
      config={filterConfig}
      initialFilters={initialFilters}
    />
  );
}
