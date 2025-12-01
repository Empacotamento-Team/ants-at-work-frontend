import FilterModal, { FilterConfig } from "./FilterModal";

type FilterData = {
  name: string;
  truckPlate: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyFilters: (filters: FilterData) => void;
  initialFilters: FilterData;
};

const filterConfig: FilterConfig<FilterData> = {
  title: "Filtrar Frotas",
  description: "Use os campos abaixo para filtrar a lista de frotas.",
  defaultValues: {
    name: "",
    truckPlate: "",
  },
  fields: [
    {
      type: "text",
      id: "name",
      label: "Nome da Frota",
      placeholder: "Filtrar por nome da frota...",
    },
    {
      type: "text",
      id: "truckPlate",
      label: "Placa do Caminhão",
      placeholder: "Pesquisar por placa do caminhão...",
    },
  ],
};

export default function FleetFilters({ open, onOpenChange, onApplyFilters, initialFilters }: Props) {
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

