import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogHeader, DialogContent, DialogTitle, DialogFooter, DialogDescription } from "@components/shadcn-ui/Dialog";
import { Button } from "./button";
import Input from "./Input";
import { useQuery } from "@tanstack/react-query";
import { productsApi } from "@/api/products";
import { Product } from "@/types/Product";
import { Packaging, PackagingProduct } from "@/types/Packaging";
import { X } from "lucide-react";

const packagingSchema = z.object({
  name: z.string().min(3, "O nome deve ter no mínimo 3 caracteres"),
  description: z.string().optional(),
  internalLength: z.coerce.number().positive("O comprimento deve ser positivo"),
  internalHeight: z.coerce.number().positive("A altura deve ser positiva"),
  internalWidth: z.coerce.number().positive("A largura deve ser positiva"),
});

type PackagingFormData = z.infer<typeof packagingSchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PackagingFormData & { products: PackagingProduct[] }) => void;
  fleetId: string;
  editingPackaging?: Packaging | null;
};

async function fetchProducts(): Promise<Product[]> {
  try {
    const result = await productsApi.getAll(0, 1000);
    return result.products || [];
  } catch {
    return [];
  }
}

export default function PackagingForm({ open, onOpenChange, onSubmit, editingPackaging }: Props) {
  const [selectedProducts, setSelectedProducts] = useState<Map<number, number>>(new Map());
  const { register, handleSubmit, reset, formState: { errors } } = useForm<PackagingFormData>({
    resolver: zodResolver(packagingSchema),
    defaultValues: {
      name: "",
      description: "",
      internalLength: undefined,
      internalHeight: undefined,
      internalWidth: undefined,
    },
  });

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  useEffect(() => {
    if (editingPackaging) {
      reset({
        name: editingPackaging.name,
        description: editingPackaging.description,
        internalLength: editingPackaging.internalLength,
        internalHeight: editingPackaging.internalHeight,
        internalWidth: editingPackaging.internalWidth,
      });
      const productMap = new Map<number, number>();
      editingPackaging.products.forEach((p) => {
        productMap.set(p.productId, p.quantity);
      });
      setSelectedProducts(productMap);
    } else {
      reset({
        name: "",
        description: "",
        internalLength: undefined,
        internalHeight: undefined,
        internalWidth: undefined,
      });
      setSelectedProducts(new Map());
    }
  }, [editingPackaging, reset, open]);

  const handleProductToggle = (productId: number) => {
    setSelectedProducts((prev) => {
      const newMap = new Map(prev);
      if (newMap.has(productId)) {
        newMap.delete(productId);
      } else {
        newMap.set(productId, 1);
      }
      return newMap;
    });
  };

  const handleQuantityChange = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      setSelectedProducts((prev) => {
        const newMap = new Map(prev);
        newMap.delete(productId);
        return newMap;
      });
    } else {
      setSelectedProducts((prev) => {
        const newMap = new Map(prev);
        newMap.set(productId, quantity);
        return newMap;
      });
    }
  };

  const handleFormSubmit = (data: PackagingFormData) => {
    const packagingProducts: PackagingProduct[] = Array.from(selectedProducts.entries()).map(([productId, quantity]) => ({
      productId,
      quantity,
    }));
    onSubmit({ ...data, products: packagingProducts });
  };

  const packagingProducts = Array.from(selectedProducts.keys()).map((id) => {
    const product = products?.find((p) => p.id === id);
    return product ? { product, quantity: selectedProducts.get(id)! } : null;
  }).filter((item): item is { product: Product; quantity: number } => item !== null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-bold text-[#4C2D2D]">
            {editingPackaging ? "Editar Embalagem" : "Adicionar Embalagem"}
          </DialogTitle>
          <DialogDescription className="text-center text-sm text-gray-600">
            {editingPackaging ? "Atualize as informações da embalagem" : "Preencha os dados para criar uma nova embalagem"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-4 p-4">
          <Input
            text="Nome da Embalagem"
            id="name"
            type="text"
            placeholder="Ex: Caixa Grande"
            register={register}
            error={errors.name?.message}
          />

          <Input
            text="Descrição"
            id="description"
            type="text"
            placeholder="Descrição opcional..."
            register={register}
            error={errors.description?.message}
          />

          <p className="text-[#4C2D2D] font-medium -mb-1 mt-2">Dimensões Internas (cm)</p>
          <div className="flex gap-2">
            <Input
              text="Comprimento"
              id="internalLength"
              type="number"
              placeholder="Ex: 100"
              register={register}
              error={errors.internalLength?.message}
            />
            <Input
              text="Largura"
              id="internalWidth"
              type="number"
              placeholder="Ex: 80"
              register={register}
              error={errors.internalWidth?.message}
            />
            <Input
              text="Altura"
              id="internalHeight"
              type="number"
              placeholder="Ex: 60"
              register={register}
              error={errors.internalHeight?.message}
            />
          </div>

          <div className="mt-4">
            <p className="text-[#4C2D2D] font-medium mb-2">Produtos na Embalagem</p>
            <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
              {products && products.length > 0 ? (
                <div className="space-y-2">
                  {products.map((product) => {
                    const isSelected = selectedProducts.has(product.id);
                    const quantity = selectedProducts.get(product.id) || 0;
                    return (
                      <div
                        key={product.id}
                        className={`flex items-center justify-between p-2 rounded border ${
                          isSelected ? "bg-[#E5DAD1] border-[#744625]" : "bg-white border-[#CABAAE]"
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleProductToggle(product.id)}
                            className="w-4 h-4 rounded border-[#CABAAE] text-[#744625] focus:ring-[#744625]"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{product.name}</p>
                            <p className="text-xs text-gray-600">
                              {product.family.name} | {product.batch || "Sem lote"} | {product.fragile ? "Frágil" : "Não frágil"}
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="flex items-center gap-2">
                            <label className="text-xs">Qtde:</label>
                            <input
                              type="number"
                              min="1"
                              value={quantity}
                              onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value) || 1)}
                              className="w-16 p-1 rounded border border-[#CABAAE] text-sm"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-600 text-center py-4">Nenhum produto disponível</p>
              )}
            </div>

            {packagingProducts.length > 0 && (
              <div className="mt-4 p-3 bg-[#F3F4F6] rounded-lg">
                <p className="text-sm font-medium mb-2">Produtos Selecionados:</p>
                <div className="space-y-1">
                  {packagingProducts.map(({ product, quantity }) => (
                    <div key={product.id} className="flex items-center justify-between text-xs">
                      <span>{product.name} (x{quantity})</span>
                      <button
                        type="button"
                        onClick={() => handleProductToggle(product.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="w-full sm:justify-end">
            <Button type="submit">
              {editingPackaging ? "Atualizar" : "Salvar"} Embalagem
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

