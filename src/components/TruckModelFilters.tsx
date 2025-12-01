import FilterModal, { FilterConfig } from "./FilterModal";

type FilterData = {
  name: string;
  type: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyFilters: (filters: FilterData) => void;
  initialFilters: FilterData;
};

const filterConfig: FilterConfig<FilterData> = {
  title: "Filtrar Modelos de Caminhão",
  description: "Use os campos abaixo para filtrar a lista de modelos.",
  defaultValues: {
    name: "",
    type: "",
  },
  fields: [
    {
      type: "text",
      id: "name",
      label: "Nome",
      placeholder: "Filtrar por nome...",
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
  ],
};

export default function TruckModelFilters({ open, onOpenChange, onApplyFilters, initialFilters }: Props) {
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

