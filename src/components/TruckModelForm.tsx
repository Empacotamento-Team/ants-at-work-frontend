import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { truckModelSchema, TruckModelData } from "@schemas/truckModelSchema";
import { TruckModel } from "@/types/TruckModel";
import Input from "./Input";
import { Button } from "./button";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogHeader, DialogContent, DialogTitle, DialogFooter, DialogDescription } from "@components/shadcn-ui/Dialog";
import { trucksApi } from "@/api/trucks";

type Props = {
  open: boolean;
  onSubmit: (data: TruckModelData) => void;
  handleOpenChange: (open: boolean) => void;
  editingModel?: TruckModel | null;
};

async function fetchTruckTypes() {
  try {
    const types = await trucksApi.getTypes();
    return types.map(type => {
      if (type === "BAU") return "Baú";
      if (type === "CARRETA") return "Carreta";
      return type;
    });
  } catch (err) {
    return ["Baú", "Carreta"];
  }
}

export default function TruckModelForm({ open, onSubmit, handleOpenChange, editingModel }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TruckModelData>({
    resolver: zodResolver(truckModelSchema),
    mode: "onBlur",
    defaultValues: {
      name: "",
      description: "",
      maximumCapacity: undefined,
      internalHeight: undefined,
      internalWidth: undefined,
      internalLength: undefined,
      type: "",
    },
  });

  const { data: truckTypes } = useQuery<string[]>({
    initialData: ["Baú", "Carreta"],
    queryKey: ["truckTypes"],
    queryFn: fetchTruckTypes,
  });

  useEffect(() => {
    if (open) {
      if (editingModel) {
        const typeMap: { [key: string]: string } = {
          "BAU": "Baú",
          "CARRETA": "Carreta",
          "Baú": "Baú",
          "Carreta": "Carreta",
        };

        const mappedType = typeMap[editingModel.type || ""] || editingModel.type || "";

        reset({
          name: editingModel.name || "",
          description: editingModel.description || "",
          maximumCapacity: editingModel.maximumCapacity ?? undefined,
          internalHeight: editingModel.internalHeight ?? undefined,
          internalWidth: editingModel.internalWidth ?? undefined,
          internalLength: editingModel.internalLength ?? undefined,
          type: mappedType || "",
        });
      } else {
        reset({
          name: "",
          description: "",
          maximumCapacity: undefined,
          internalHeight: undefined,
          internalWidth: undefined,
          internalLength: undefined,
          type: "",
        });
      }
    } else {
      reset({
        name: "",
        description: "",
        maximumCapacity: undefined,
        internalHeight: undefined,
        internalWidth: undefined,
        internalLength: undefined,
        type: "",
      });
    }
  }, [open, editingModel, reset]);

  const handleFormSubmit = (data: TruckModelData) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-3 p-4">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-bold text-[#4C2D2D]">
              {editingModel ? "Editar Modelo de Caminhão" : "Cadastrar Modelo de Caminhão"}
            </DialogTitle>
            <DialogDescription className="text-center text-sm text-gray-600">
              {editingModel ? "Atualize as informações do modelo" : "Preencha os dados para cadastrar um novo modelo"}
            </DialogDescription>
          </DialogHeader>

          <Input
            text="Nome do Modelo"
            id="name"
            type="text"
            placeholder="Insira o nome do modelo..."
            register={register}
            error={errors.name?.message}
          />

          <div className="flex flex-col w-full mt-2">
            <label
              htmlFor="description"
              className="mb-1 text-[#4C2D2D] font-medium"
            >
              Descrição (opcional)
            </label>
            <textarea
              id="description"
              placeholder="Insira uma descrição para o modelo..."
              {...register("description")}
              className="w-full p-2 rounded-lg border-2 border-[#CABAAE] bg-[#E5DAD1] text-[#3F2323] text-sm hover:border-[#4C2D2D] focus:outline-none focus:ring-2 focus:ring-[#744625] transition"
              rows={3}
            />
            {errors.description && (
              <p className="text-[#800000] text-xs mt-1 ml-1 font-medium">
                {errors.description.message}
              </p>
            )}
          </div>

          <Input
            text="Capacidade Máxima (kg)"
            id="maximumCapacity"
            type="number"
            placeholder="Insira a capacidade em kg..."
            register={register}
            error={errors.maximumCapacity?.message}
          />

          <p className="text-[#4C2D2D] font-medium -mb-1">
            Dimensões Internas (m)
          </p>
          <div className="flex gap-2">
            <Input
              text="Comprimento (m)"
              id="internalLength"
              type="number"
              placeholder="Ex: 14.5"
              register={register}
              error={errors.internalLength?.message}
            />
            <Input
              text="Largura (m)"
              id="internalWidth"
              type="number"
              placeholder="Ex: 2.6"
              register={register}
              error={errors.internalWidth?.message}
            />
            <Input
              text="Altura (m)"
              id="internalHeight"
              type="number"
              placeholder="Ex: 3.1"
              register={register}
              error={errors.internalHeight?.message}
            />
          </div>

          <div className="flex flex-col w-full mt-2">
            <label
              htmlFor="type"
              className="mb-1 text-[#4C2D2D] font-medium"
            >
              Tipo
            </label>
            <select
              id="type"
              {...register("type")}
              className="w-full p-2 rounded-lg border-2 border-[#CABAAE] bg-[#E5DAD1] text-[#3F2323] text-sm hover:border-[#4C2D2D] focus:outline-none focus:ring-2 focus:ring-[#744625] transition"
            >
              <option value="">Selecione o tipo</option>
              {truckTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            {errors.type && (
              <p className="text-[#800000] text-xs mt-1 ml-1 font-medium">
                {errors.type.message}
              </p>
            )}
          </div>

          <DialogFooter className="w-full sm:justify-end">
            <Button type="submit">
              {editingModel ? "Atualizar" : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

