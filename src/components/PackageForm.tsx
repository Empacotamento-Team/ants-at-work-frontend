import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { packageSchema, PackageData } from "@schemas/packageSchema";
import { Package } from "@/types/Package";
import Input from "./Input";
import { Button } from "./button";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogHeader, DialogContent, DialogTitle, DialogFooter, DialogDescription } from "@components/shadcn-ui/Dialog";
import { productsApi } from "@/api/products";
import { Product } from "@/types/Product";
import api from "@/api/axios";

type Props = {
  open: boolean;
  onSubmit: (data: PackageData) => void;
  handleOpenChange: (open: boolean) => void;
  editingPackage?: Package | null;
};

async function fetchProducts(): Promise<Product[]> {
  try {
    const result = await productsApi.getAll(0, 1000);
    return result.products || [];
  } catch {
    return [];
  }
}

async function fetchPackagings(): Promise<any[]> {
  try {
    const response = await api.get("/packaging");
    return Array.isArray(response.data) ? response.data : [];
  } catch {
    return [];
  }
}

export default function PackageForm({ open, onSubmit, handleOpenChange, editingPackage }: Props) {
  const [useExistingPackaging, setUseExistingPackaging] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PackageData>({
    resolver: zodResolver(packageSchema),
    mode: "onBlur",
    defaultValues: {
      packagingId: undefined,
      packagingName: undefined,
      packagingDescription: undefined,
      packagingHeight: undefined,
      packagingWidth: undefined,
      packagingLength: undefined,
      productId: undefined,
    },
  });

  const { data: products } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: fetchProducts,
    initialData: [],
    retry: 1,
    enabled: open,
    refetchOnMount: true,
  });

  const { data: packagings } = useQuery<any[]>({
    queryKey: ["packagings"],
    queryFn: fetchPackagings,
    initialData: [],
    retry: 1,
    enabled: open,
    refetchOnMount: true,
  });

  useEffect(() => {
    if (editingPackage) {
      // Na edição, sempre mostrar todos os campos completos
      setUseExistingPackaging(false);
      
      // Extrair dimensões de forma segura
      const dims = editingPackage.packaging?.internalDimensions;
      const height = dims?.height != null && !isNaN(Number(dims.height)) ? Number(dims.height) : undefined;
      const width = dims?.width != null && !isNaN(Number(dims.width)) ? Number(dims.width) : undefined;
      const length = dims?.length != null && !isNaN(Number(dims.length)) ? Number(dims.length) : undefined;
      
      reset({
        packagingId: undefined,
        packagingName: editingPackage.packaging?.name || "",
        packagingDescription: editingPackage.packaging?.description || "",
        packagingHeight: height,
        packagingWidth: width,
        packagingLength: length,
        productId: editingPackage.product?.id,
      });
    } else {
      // Na criação, permitir escolher entre usar existente ou criar nova
      setUseExistingPackaging(true);
      reset({
        packagingId: undefined,
        productId: undefined,
        packagingName: undefined,
        packagingDescription: undefined,
        packagingHeight: undefined,
        packagingWidth: undefined,
        packagingLength: undefined,
      });
    }
  }, [editingPackage, reset, open]);

  const handleFormSubmit = (data: PackageData) => {
    if (editingPackage) {
      // Na edição, sempre enviar como nova embalagem (com todos os campos)
      const submitData = {
        ...data,
        packagingId: undefined, // Remove packagingId na edição
      };
      onSubmit(submitData);
    } else {
      // Na criação, limpar campos não utilizados baseado na escolha
      if (useExistingPackaging) {
        const submitData = {
          ...data,
          packagingName: undefined,
          packagingDescription: undefined,
          packagingHeight: undefined,
          packagingWidth: undefined,
          packagingLength: undefined,
        };
        onSubmit(submitData);
      } else {
        const submitData = {
          ...data,
          packagingId: undefined,
        };
        onSubmit(submitData);
      }
    }
  };

  const isEditing = !!editingPackage;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-3 p-4">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-bold text-[#4C2D2D]">
              {editingPackage ? "Editar Pacote" : "Cadastrar Pacote"}
            </DialogTitle>
            <DialogDescription className="text-center text-sm text-gray-600">
              {editingPackage ? "Atualize as informações do pacote" : "Preencha os dados para cadastrar um novo pacote"}
            </DialogDescription>
          </DialogHeader>

          {!isEditing && (
            <div className="flex items-center gap-2 mt-2">
              <input
                type="radio"
                id="existingPackaging"
                checked={useExistingPackaging}
                onChange={() => setUseExistingPackaging(true)}
                className="w-4 h-4"
              />
              <label htmlFor="existingPackaging" className="text-[#4C2D2D] font-medium text-sm">
                Usar embalagem existente
              </label>
              <input
                type="radio"
                id="newPackaging"
                checked={!useExistingPackaging}
                onChange={() => setUseExistingPackaging(false)}
                className="w-4 h-4 ml-4"
              />
              <label htmlFor="newPackaging" className="text-[#4C2D2D] font-medium text-sm">
                Criar nova embalagem
              </label>
            </div>
          )}

          {isEditing || !useExistingPackaging ? (
            <>
              <Input
                text="Nome da Embalagem"
                id="packagingName"
                type="text"
                placeholder="Insira o nome da embalagem..."
                register={register}
                error={errors.packagingName?.message}
              />
              <Input
                text="Descrição da Embalagem (opcional)"
                id="packagingDescription"
                type="text"
                placeholder="Insira a descrição..."
                register={register}
                error={errors.packagingDescription?.message}
              />
              <p className="text-[#4C2D2D] font-medium -mb-1 mt-2">Dimensões da Embalagem (cm)</p>
              <div className="flex gap-2">
                <Input
                  text="Altura"
                  id="packagingHeight"
                  type="number"
                  placeholder="Ex: 20.5"
                  register={register}
                  error={errors.packagingHeight?.message}
                />
                <Input
                  text="Largura"
                  id="packagingWidth"
                  type="number"
                  placeholder="Ex: 15.0"
                  register={register}
                  error={errors.packagingWidth?.message}
                />
                <Input
                  text="Comprimento"
                  id="packagingLength"
                  type="number"
                  placeholder="Ex: 30.0"
                  register={register}
                  error={errors.packagingLength?.message}
                />
              </div>
            </>
          ) : (
            <div className="flex flex-col w-full mt-2">
              <label
                htmlFor="packagingId"
                className="mb-1 text-[#4C2D2D] font-medium"
              >
                Embalagem
              </label>
              <select
                id="packagingId"
                {...register("packagingId")}
                className="w-full p-2 rounded-lg border-2 border-[#CABAAE] bg-[#E5DAD1] text-[#3F2323] text-sm hover:border-[#4C2D2D] focus:outline-none focus:ring-2 focus:ring-[#744625] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Selecione a embalagem</option>
                {packagings && packagings.length > 0 ? (
                  packagings.map((packaging: any) => (
                    <option key={packaging.id} value={packaging.id}>
                      {packaging.name}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>Nenhuma embalagem disponível</option>
                )}
              </select>
              {errors.packagingId && (
                <p className="text-[#800000] text-xs mt-1 ml-1 font-medium">
                  {errors.packagingId.message}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col w-full mt-2">
            <label
              htmlFor="productId"
              className="mb-1 text-[#4C2D2D] font-medium"
            >
              Produto
            </label>
            <select
              id="productId"
              {...register("productId")}
              className="w-full p-2 rounded-lg border-2 border-[#CABAAE] bg-[#E5DAD1] text-[#3F2323] text-sm hover:border-[#4C2D2D] focus:outline-none focus:ring-2 focus:ring-[#744625] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Selecione o produto</option>
              {products && products.length > 0 ? (
                products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))
              ) : (
                <option value="" disabled>Nenhum produto disponível</option>
              )}
            </select>
            {errors.productId && (
              <p className="text-[#800000] text-xs mt-1 ml-1 font-medium">
                {errors.productId.message}
              </p>
            )}
          </div>

          <DialogFooter className="w-full sm:justify-end">
            <Button type="submit">
              {editingPackage ? "Atualizar" : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
