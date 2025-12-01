import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema, ProductData } from "@schemas/productSchema";
import { Product } from "@/types/Product";
import Input from "./Input";
import { Button } from "./button";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogHeader, DialogContent, DialogTitle, DialogFooter, DialogDescription } from "@components/shadcn-ui/Dialog";
import { productFamiliesApi } from "@/api/productFamilies";
import { ProductFamily } from "@/types/ProductFamily";

type Props = {
  open: boolean;
  onSubmit: (data: ProductData) => void;
  handleOpenChange: (open: boolean) => void;
  editingProduct?: Product | null;
};

async function fetchProductFamilies(): Promise<ProductFamily[]> {
  try {
    const result = await productFamiliesApi.getAll(0, 1000);
    return result.families || [];
  } catch {
    return [];
  }
}

export default function ProductForm({ open, onSubmit, handleOpenChange, editingProduct }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductData>({
    resolver: zodResolver(productSchema),
    mode: "onBlur",
    defaultValues: {
      name: "",
      familyId: undefined,
      height: undefined,
      width: undefined,
      length: undefined,
      weight: undefined,
      maxSupportedWeight: undefined,
      batch: "",
      fragile: false,
    },
  });

  const { data: productFamilies } = useQuery<ProductFamily[]>({
    queryKey: ["productFamilies"],
    queryFn: fetchProductFamilies,
    initialData: [],
    retry: 1,
  });

  const selectedFamilyId = watch("familyId");

  useEffect(() => {
    if (editingProduct) {
      reset({
        name: editingProduct.name || "",
        familyId: editingProduct.family?.id,
        height: editingProduct.dimensions?.height,
        width: editingProduct.dimensions?.width,
        length: editingProduct.dimensions?.length,
        weight: editingProduct.weight,
        maxSupportedWeight: editingProduct.maxSupportedWeight,
        batch: editingProduct.batch || "",
        fragile: editingProduct.fragile || false,
      });
    } else {
      reset({
        name: "",
        familyId: undefined,
        height: undefined,
        width: undefined,
        length: undefined,
        weight: undefined,
        maxSupportedWeight: undefined,
        batch: "",
        fragile: false,
      });
    }
  }, [editingProduct, reset, open]);

  useEffect(() => {
    if (selectedFamilyId && productFamilies && productFamilies.length > 0 && !editingProduct) {
      const selectedFamily = productFamilies.find(family => family.id === Number(selectedFamilyId));
      if (selectedFamily && selectedFamily.defaultMaxSupportedWeight) {
        setValue("maxSupportedWeight", selectedFamily.defaultMaxSupportedWeight);
      }
    }
  }, [selectedFamilyId, productFamilies, setValue, editingProduct]);

  const handleFormSubmit = (data: ProductData) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-3 p-4">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-bold text-[#4C2D2D]">
              {editingProduct ? "Editar Produto" : "Cadastrar Produto"}
            </DialogTitle>
            <DialogDescription className="text-center text-sm text-gray-600">
              {editingProduct ? "Atualize as informações do produto" : "Preencha os dados para cadastrar um novo produto"}
            </DialogDescription>
          </DialogHeader>

          <Input
            text="Nome do Produto"
            id="name"
            type="text"
            placeholder="Insira o nome do produto..."
            register={register}
            error={errors.name?.message}
          />

          <div className="flex flex-col w-full mt-2">
            <label
              htmlFor="familyId"
              className="mb-1 text-[#4C2D2D] font-medium"
            >
              Família do Produto
            </label>
            <select
              id="familyId"
              {...register("familyId")}
              className="w-full p-2 rounded-lg border-2 border-[#CABAAE] bg-[#E5DAD1] text-[#3F2323] text-sm hover:border-[#4C2D2D] focus:outline-none focus:ring-2 focus:ring-[#744625] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">
                {"Selecione a família"}
              </option>
              {productFamilies && productFamilies.length > 0 ? (
                productFamilies.map((family) => (
                  <option key={family.id} value={family.id}>
                    {family.name}
                  </option>
                ))
              ) : (
                <option value="" disabled>Nenhuma família disponível</option>
              )}
            </select>
            {errors.familyId && (
              <p className="text-[#800000] text-xs mt-1 ml-1 font-medium">
                {errors.familyId.message}
              </p>
            )}
          </div>

          <p className="text-[#4C2D2D] font-medium -mb-1 mt-2">
            Dimensões (cm)
          </p>
          <div className="flex gap-2">
            <Input
              text="Altura"
              id="height"
              type="number"
              placeholder="Ex: 20.5"
              register={register}
              error={errors.height?.message}
            />
            <Input
              text="Largura"
              id="width"
              type="number"
              placeholder="Ex: 15.0"
              register={register}
              error={errors.width?.message}
            />
            <Input
              text="Comprimento"
              id="length"
              type="number"
              placeholder="Ex: 30.0"
              register={register}
              error={errors.length?.message}
            />
          </div>

          <div className="flex gap-2">
            <Input
              text="Peso (kg)"
              id="weight"
              type="number"
              placeholder="Insira o peso em kg..."
              register={register}
              error={errors.weight?.message}
            />
            <Input
              text="Peso Máximo Suportado (kg)"
              id="maxSupportedWeight"
              type="number"
              placeholder="Insira o peso máximo suportado..."
              register={register}
              error={errors.maxSupportedWeight?.message}
            />
          </div>

          <Input
            text="Lote"
            id="batch"
            type="text"
            placeholder="Insira o lote (opcional)..."
            register={register}
            error={errors.batch?.message}
          />

          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="fragile"
              {...register("fragile", { setValueAs: (value) => value === true || value === "on" })}
              className="w-4 h-4 rounded border-[#CABAAE] text-[#744625] focus:ring-[#744625]"
            />
            <label htmlFor="fragile" className="text-[#4C2D2D] font-medium text-sm">
              Produto frágil
            </label>
          </div>
          {errors.fragile && (
            <p className="text-[#800000] text-xs mt-1 ml-1 font-medium">
              {errors.fragile.message as string}
            </p>
          )}

          <DialogFooter className="w-full sm:justify-end">
            <Button type="submit">
              {editingProduct ? "Atualizar" : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

