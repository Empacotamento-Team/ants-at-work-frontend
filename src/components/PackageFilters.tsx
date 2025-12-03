import { useQuery } from "@tanstack/react-query";
import { productsApi } from "@/api/products";
import FilterModal, { FilterConfig, FilterFieldType } from "./FilterModal";
import { useMemo } from "react";

type FilterData = {
  packagingName: string;
  productId: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyFilters: (filters: FilterData) => void;
  initialFilters?: FilterData;
};

async function fetchProducts() {
  try {
    const result = await productsApi.getAll(0, 1000);
    return result.products || [];
  } catch {
    return [];
  }
}

export default function PackageFilters({ open, onOpenChange, onApplyFilters, initialFilters }: Props) {
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
    initialData: [],
    retry: 1,
  });

  const productOptions = useMemo(() => {
    const options = [{ value: "", label: "Todos os produtos" }];
    if (products && products.length > 0) {
      products.forEach((product) => {
        options.push({ value: String(product.id), label: product.name });
      });
    } else {
      options.push({ value: "", label: "Nenhum produto disponível", disabled: true } as any);
    }
    return options;
  }, [products]);

  const filterConfig: FilterConfig<FilterData> = useMemo(() => ({
    title: "Filtrar Pacotes",
    description: "Selecione os filtros desejados para buscar pacotes",
    defaultValues: {
      packagingName: "",
      productId: "",
    },
    fields: [
      {
        type: "text",
        id: "packagingName",
        label: "Nome da Embalagem",
        placeholder: "Buscar por nome da embalagem...",
      },
      {
        type: "asyncSelect",
        id: "productId",
        label: "Produto",
        options: productOptions,
        isLoading: isLoadingProducts,
      } as FilterFieldType,
    ],
  }), [productOptions, isLoadingProducts]);

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

