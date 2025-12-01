import FilterModal, { FilterConfig } from "./FilterModal";

type FilterData = {
  name: string;
  description: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyFilters: (filters: FilterData) => void;
  initialFilters: FilterData;
};

const filterConfig: FilterConfig<FilterData> = {
  title: "Filtrar Famílias de Produtos",
  description: "Use os campos abaixo para filtrar a lista de famílias.",
  defaultValues: {
    name: "",
    description: "",
  },
  fields: [
    {
      type: "text",
      id: "name",
      label: "Nome da Família",
      placeholder: "Filtrar por nome...",
    },
    {
      type: "text",
      id: "description",
      label: "Descrição",
      placeholder: "Filtrar por descrição...",
    },
  ],
};

export default function ProductFamilyFilters({ open, onOpenChange, onApplyFilters, initialFilters }: Props) {
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
