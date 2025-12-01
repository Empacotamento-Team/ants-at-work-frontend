import { useQuery } from "@tanstack/react-query";
import { productsApi } from "@/api/products";
import FilterModal, { FilterConfig, FilterFieldType } from "./FilterModal";
import { useMemo } from "react";

type FilterData = {
  name: string;
  familyId: string;
  batch: string;
  fragile: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyFilters: (filters: FilterData) => void;
  initialFilters?: FilterData;
};

async function fetchProductFamilies() {
  try {
    return await productsApi.getFamilies();
  } catch {
    return [];
  }
}

export default function ProductFilters({ open, onOpenChange, onApplyFilters, initialFilters }: Props) {
  const { data: productFamilies, isLoading } = useQuery({
    queryKey: ["productFamilies"],
    queryFn: fetchProductFamilies,
    initialData: [],
    retry: 1,
  });

  const familyOptions = useMemo(() => {
    const options = [{ value: "", label: "Todas as famílias" }];
    if (productFamilies && productFamilies.length > 0) {
      productFamilies.forEach((family) => {
        options.push({ value: String(family.id), label: family.name });
      });
    } else {
      options.push({ value: "", label: "Nenhuma família disponível", disabled: true } as any);
    }
    return options;
  }, [productFamilies]);

  const filterConfig: FilterConfig<FilterData> = useMemo(() => ({
    title: "Filtrar Produtos",
    description: "Selecione os filtros desejados para buscar produtos",
    defaultValues: {
      name: "",
      familyId: "",
      batch: "",
      fragile: "",
    },
    fields: [
      {
        type: "text",
        id: "name",
        label: "Nome do Produto",
        placeholder: "Buscar por nome...",
      },
      {
        type: "asyncSelect",
        id: "familyId",
        label: "Família do Produto",
        options: familyOptions,
        isLoading,
      } as FilterFieldType,
      {
        type: "text",
        id: "batch",
        label: "Lote",
        placeholder: "Buscar por lote...",
      },
      {
        type: "select",
        id: "fragile",
        label: "Produto Frágil",
        options: [
          { value: "", label: "Todos" },
          { value: "true", label: "Sim" },
          { value: "false", label: "Não" },
        ],
      },
    ],
  }), [familyOptions, isLoading]);

  return (
    <FilterModal
      open={open}
      onOpenChange={onOpenChange}
      onApplyFilters={onApplyFilters}
      config={filterConfig}
      initialFilters={initialFilters || filterConfig.defaultValues}
    />
  );
}
