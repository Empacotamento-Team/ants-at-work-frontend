import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { truckSchema, TruckData } from "@schemas/truckSchema";
import { Truck } from "@/types/Truck";
import Input from "./Input";
import { Button } from "./button";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogHeader, DialogContent, DialogTitle, DialogFooter, DialogDescription } from "@components/shadcn-ui/Dialog";
import { trucksApi } from "@/api/trucks";

type Props = {
  open: boolean;
  onSubmit: (data: TruckData) => void;
  handleOpenChange: (open: boolean) => void;
  editingTruck?: Truck | null;
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
    console.error("Falha ao buscar tipos de caminhão:", err);
    return ["Baú", "Carreta"];
  }
}

export default function TruckForm({ open, onSubmit, handleOpenChange, editingTruck }: Props) {
  const [step, setStep] = useState(1);

  const {
    register,
    handleSubmit,
    trigger,
    reset,
    formState: { errors },
  } = useForm<TruckData>({
    resolver: zodResolver(truckSchema),
    mode: "onBlur",
    defaultValues: editingTruck ? {
      plate: editingTruck.plate,
      maximumCapacity: editingTruck.maximumCapacity,
      internalHeight: editingTruck.internalHeight,
      internalWidth: editingTruck.internalWidth,
      internalLength: editingTruck.internalLength,
      type: editingTruck.type,
      status: editingTruck.status,
      currentMileage: editingTruck.currentMileage,
      details: editingTruck.details,
      maintenanceNote: editingTruck.maintenanceNote,
    } : undefined,
  });

  const { data: truckTypes } = useQuery<string[]>({
    initialData: ["Baú", "Carreta"],
    queryKey: ["truckTypes"],
    queryFn: fetchTruckTypes,
  });

  useEffect(() => {
    if (editingTruck) {
      reset({
        plate: editingTruck.plate,
        maximumCapacity: editingTruck.maximumCapacity,
        internalHeight: editingTruck.internalHeight,
        internalWidth: editingTruck.internalWidth,
        internalLength: editingTruck.internalLength,
        type: editingTruck.type,
        status: editingTruck.status,
        currentMileage: editingTruck.currentMileage,
        details: editingTruck.details,
        maintenanceNote: editingTruck.maintenanceNote,
      });
    } else {
      reset();
    }
  }, [editingTruck, reset]);

  const handleNextStep = async () => {
    const fieldsToValidate: (keyof TruckData)[] = [
      "plate",
      "maximumCapacity",
      "internalLength",
      "internalWidth",
      "internalHeight",
      "type",
    ];
    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep(2);
    }
  };

  const handlePrevStep = () => {
    setStep(1);
  };

  const handleFormSubmit = (data: TruckData) => {
    console.log("Form submitted with data:", JSON.stringify(data, null, 2));
    console.log("Form validation passed");
    console.log("Form state:", { errors, isValid: Object.keys(errors).length === 0 });
    onSubmit(data);
  };

  const handleFormError = (errors: any) => {
    console.log("Form validation errors:", errors);
  };

  console.log("TruckForm rendered with:", { open, editingTruck, step, errors });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} >
      <DialogContent className="max-w-10xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit(handleFormSubmit, handleFormError)} className="flex flex-col gap-3 p-4">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-bold text-[#4C2D2D]">
              {editingTruck ? "Editar Caminhão" : "Cadastrar Caminhão"} - Etapa {step} de 2:{" "}
              {step === 1 ? "Dados Básicos" : "Dados de Manutenção"}
            </DialogTitle>
            <DialogDescription className="text-center text-sm text-gray-600">
              {editingTruck ? "Atualize as informações do caminhão" : "Preencha os dados para cadastrar um novo caminhão"}
            </DialogDescription>
            <div className="text-center mb-4"> 
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div
                  className="bg-[#E5DAD1] h-2.5 rounded-full transition-all duration-500"
                  style={{ width: step === 1 ? "50%" : "100%" }}
                ></div>
              </div>
            </div>
          </DialogHeader>

          {step === 1 && (
            <>
              <Input
                text="Placa"
                id="plate"
                type="text"
                placeholder="Insira a placa..."
                register={register}
                error={errors.plate?.message}
              />
              <Input
                text="Capacidade Máxima (kg)"
                id="maximumCapacity"
                type="number"
                placeholder="Insira a capacidade em kg..."
                register={register}
                error={errors.maximumCapacity?.message}
              />
              <p className="text-[#4C2D2D] font-medium -mb-1">
                Dimensões Internas
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
              <div className="flex flex-col w-full mt-2">
                <label
                  htmlFor="details"
                  className="mb-1 text-[#4C2D2D] font-medium"
                >
                  Detalhes/Sobre
                </label>
                <textarea
                  id="details"
                  placeholder="Observações adicionais sobre o caminhão..."
                  {...register("details")}
                  className="w-full p-2 rounded-lg border-2 border-[#CABAAE] bg-[#E5DAD1] text-[#3F2323] text-sm hover:border-[#4C2D2D] focus:outline-none focus:ring-2 focus:ring-[#744625] transition"
                  rows={3}
                />
                {errors.details && (
                  <p className="text-[#800000] text-xs mt-1 ml-1 font-medium">
                    {errors.details.message}
                  </p>
                )}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="flex flex-col w-full mt-2">
                <label
                  htmlFor="status"
                  className="mb-1 text-[#4C2D2D] font-medium"
                >
                  Status
                </label>
                <select
                  id="status"
                  {...register("status")}
                  className="w-full p-2 rounded-lg border-2 border-[#CABAAE] bg-[#E5DAD1] text-[#3F2323] text-sm hover:border-[#4C2D2D] focus:outline-none focus:ring-2 focus:ring-[#744625] transition"
                >
                  <option value="">Selecione o status</option>
                  <option value="active">Ativo</option>
                  <option value="maintenance">Manutenção</option>
                  <option value="inactive">Inativo</option>
                </select>
                {errors.status && (
                  <p className="text-[#800000] text-xs mt-1 ml-1 font-medium">
                    {errors.status.message}
                  </p>
                )}
              </div>
              <Input
                text="Quilometragem Atual"
                id="currentMileage"
                type="number"
                placeholder="Insira a quilometragem atual"
                register={register}
                error={errors.currentMileage?.message}
              />
              <div className="flex flex-col w-full mt-2">
                <label
                  htmlFor="maintenanceNote"
                  className="mb-1 text-[#4C2D2D] font-medium"
                >
                  Notas de Manutenção
                </label>
                <textarea
                  id="maintenanceNote"
                  placeholder="Observações sobre manutenção..."
                  {...register("maintenanceNote")}
                  className="w-full p-2 rounded-lg border-2 border-[#CABAAE] bg-[#E5DAD1] text-[#3F2323] text-sm hover:border-[#4C2D2D] focus:outline-none focus:ring-2 focus:ring-[#744625] transition"
                  rows={3}
                />
                {errors.maintenanceNote && (
                  <p className="text-[#800000] text-xs mt-1 ml-1 font-medium">
                    {errors.maintenanceNote.message}
                  </p>
                )}
              </div>
            </>
          )}

          <DialogFooter className="w-full sm:justify-between">
            <div>
              {step === 2 && (
                <Button type="button" onClick={handlePrevStep}>
                  Voltar
                </Button>
              )}
            </div>

            <div>
              {step === 1 && (
                <Button type="button" onClick={handleNextStep}>
                  Próximo
                </Button>
              )}

              {step === 2 && (
                <Button 
                  type="submit"
                  onClick={() => console.log("Submit button clicked")}
                >
                  {editingTruck ? "Atualizar" : "Salvar"}
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}