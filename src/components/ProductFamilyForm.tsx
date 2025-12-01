import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { productFamilySchema, ProductFamilyData } from "@schemas/productFamilySchema";
import { ProductFamily } from "@/types/ProductFamily";
import Input from "./Input";
import { Button } from "./button";
import { Dialog, DialogHeader, DialogContent, DialogTitle, DialogFooter, DialogDescription } from "@components/shadcn-ui/Dialog";

type Props = {
  open: boolean;
  onSubmit: (data: ProductFamilyData) => void;
  handleOpenChange: (open: boolean) => void;
  editingFamily?: ProductFamily | null;
};

export default function ProductFamilyForm({ open, onSubmit, handleOpenChange, editingFamily }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFamilyData>({
    resolver: zodResolver(productFamilySchema),
    mode: "onBlur",
    defaultValues: {
      name: "",
      description: "",
      defaultMaxSupportedWeight: undefined,
    },
  });

  useEffect(() => {
    if (editingFamily) {
      reset({
        name: editingFamily.name || "",
        description: editingFamily.description || "",
        defaultMaxSupportedWeight: editingFamily.defaultMaxSupportedWeight,
      });
    } else {
      reset({
        name: "",
        description: "",
        defaultMaxSupportedWeight: undefined,
      });
    }
  }, [editingFamily, reset, open]);

  const handleFormSubmit = (data: ProductFamilyData) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-3 p-4">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-bold text-[#4C2D2D]">
              {editingFamily ? "Editar Família de Produto" : "Cadastrar Família de Produto"}
            </DialogTitle>
            <DialogDescription className="text-center text-sm text-gray-600">
              {editingFamily ? "Atualize as informações da família" : "Preencha os dados para cadastrar uma nova família"}
            </DialogDescription>
          </DialogHeader>

          <Input
            text="Nome da Família"
            id="name"
            type="text"
            placeholder="Insira o nome da família..."
            register={register}
            error={errors.name?.message}
          />

          <div className="flex flex-col w-full mt-2">
            <label
              htmlFor="description"
              className="mb-1 text-[#4C2D2D] font-medium"
            >
              Descrição
            </label>
            <textarea
              id="description"
              {...register("description")}
              placeholder="Insira a descrição..."
              className="w-full p-2 rounded-lg border-2 border-[#CABAAE] bg-[#E5DAD1] text-[#3F2323] text-sm hover:border-[#4C2D2D] focus:outline-none focus:ring-2 focus:ring-[#744625] transition min-h-[100px]"
            />
            {errors.description && (
              <p className="text-[#800000] text-xs mt-1 ml-1 font-medium">
                {errors.description.message}
              </p>
            )}
          </div>

          <Input
            text="Peso Máximo Suportado por Padrão (kg)"
            id="defaultMaxSupportedWeight"
            type="number"
            placeholder="Insira o peso máximo suportado..."
            register={register}
            error={errors.defaultMaxSupportedWeight?.message}
          />

          <DialogFooter className="w-full sm:justify-end">
            <Button type="submit">
              {editingFamily ? "Atualizar" : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

