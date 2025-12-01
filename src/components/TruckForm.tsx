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
import { truckModelsApi } from "@/api/truckModels";
import { TruckModel } from "@/types/TruckModel";

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
    return ["Baú", "Carreta"];
  }
}

async function fetchTruckModels(): Promise<TruckModel[]> {
  try {
    const result = await truckModelsApi.getAll(0, 1000);
    return result.models || [];
  } catch {
    return [];
  }
}

function mapStatusToFormValue(status: string): string {
  const statusMap: { [key: string]: string } = {
    "AVAILABLE": "active",
    "UNDER_MAINTENANCE": "maintenance",
    "UNAVAILABLE": "inactive",
    "Ativo": "active",
    "Em Manutenção": "maintenance",
    "Inativo": "inactive",
    "Em Manutencao": "maintenance",
    "Manutenção": "maintenance",
    "Manutencao": "maintenance",
    "ativo": "active",
    "inativo": "inactive",
    "ATIVO": "active",
    "INATIVO": "inactive",
    "EM MANUTENÇÃO": "maintenance",
    "EM MANUTENCAO": "maintenance",
    "MANUTENÇÃO": "maintenance",
    "MANUTENCAO": "maintenance",
    "ACTIVE": "active",
    "MAINTENANCE": "maintenance",
    "INACTIVE": "inactive",
  };

  const originalStatus = String(status || "").trim();
  const normalizedStatus = originalStatus.toUpperCase();
  const normalizedWithoutAccents = normalizedStatus
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  
  let mappedStatus = statusMap[originalStatus] 
    || statusMap[normalizedStatus] 
    || statusMap[normalizedWithoutAccents] 
    || "";
  
  if (!mappedStatus) {
    const searchStatus = normalizedWithoutAccents;
    if (searchStatus.includes("INATIVO") || searchStatus.includes("UNAVAILABLE")) {
      mappedStatus = "inactive";
    } else if (searchStatus.includes("MANUTEN") || searchStatus.includes("UNDER_MAINTENANCE")) {
      mappedStatus = "maintenance";
    } else if (searchStatus.includes("ATIVO") || searchStatus.includes("AVAILABLE")) {
      mappedStatus = "active";
    }
  }

  return mappedStatus;
}

export default function TruckForm({ open, onSubmit, handleOpenChange, editingTruck }: Props) {
  const [step, setStep] = useState(1);

  const {
    register,
    handleSubmit,
    trigger,
    reset,
    setValue,
    watch,
    getValues,
    formState: { errors },
  } = useForm<TruckData>({
    resolver: zodResolver(truckSchema),
    mode: "onBlur",
    defaultValues: undefined,
  });

  const { data: truckTypes } = useQuery<string[]>({
    initialData: ["Baú", "Carreta"],
    queryKey: ["truckTypes"],
    queryFn: fetchTruckTypes,
  });

  const { data: truckModels } = useQuery<TruckModel[]>({
    queryKey: ["truckModels"],
    queryFn: fetchTruckModels,
    initialData: [],
  });

  const selectedModelId = watch("modelId" as any);

  useEffect(() => {
    if (open) {
      if (editingTruck) {
        const typeMap: { [key: string]: string } = {
          "BAU": "Baú",
          "CARRETA": "Carreta",
          "Baú": "Baú",
          "Carreta": "Carreta",
        };

        const mappedType = typeMap[editingTruck.type || ""] || editingTruck.type || "";
        const mappedStatus = mapStatusToFormValue(editingTruck.status || "");

        const modelIdValue = editingTruck.modelId || editingTruck.model?.id || undefined;
        
        const formData = {
          plate: editingTruck.plate || "",
          maximumCapacity: editingTruck.maximumCapacity ?? undefined,
          internalHeight: editingTruck.internalHeight ?? undefined,
          internalWidth: editingTruck.internalWidth ?? undefined,
          internalLength: editingTruck.internalLength ?? undefined,
          type: mappedType || "",
          status: mappedStatus || "",
          currentMileage: editingTruck.currentMileage ?? undefined,
          details: editingTruck.details || "",
          maintenanceNote: editingTruck.maintenanceNote || "",
          modelId: modelIdValue ? String(modelIdValue) : undefined,
        };
        
        reset(formData, { keepDefaultValues: false });
      } else {
        reset({
          plate: "",
          maximumCapacity: undefined,
          internalHeight: undefined,
          internalWidth: undefined,
          internalLength: undefined,
          type: "",
          status: "",
          currentMileage: undefined,
          details: "",
          maintenanceNote: "",
          modelId: undefined,
        });
      }
      setStep(1);
    } else {
      reset({
        plate: "",
        maximumCapacity: undefined,
        internalHeight: undefined,
        internalWidth: undefined,
        internalLength: undefined,
        type: "",
        status: "",
        currentMileage: undefined,
        details: "",
        maintenanceNote: "",
        modelId: undefined,
      });
      setStep(1);
    }
  }, [open, editingTruck, reset]);

  useEffect(() => {
    if (open && editingTruck) {
      const mappedStatus = mapStatusToFormValue(editingTruck.status || "");
      
      if (mappedStatus) {
        setValue("status", mappedStatus, { shouldValidate: false, shouldDirty: false });
        
        const timer = setTimeout(() => {
          setValue("status", mappedStatus, { shouldValidate: false, shouldDirty: false });
        }, 50);
        
        return () => clearTimeout(timer);
      }
    }
  }, [open, editingTruck, setValue, step]);

  useEffect(() => {
    if (selectedModelId && truckModels && truckModels.length > 0) {
      const selectedModel = truckModels.find(model => model.id === String(selectedModelId));
      if (selectedModel) {
        const typeMap: { [key: string]: string } = {
          "BAU": "Baú",
          "CARRETA": "Carreta",
          "Baú": "Baú",
          "Carreta": "Carreta",
        };

        const mappedType = typeMap[selectedModel.type || ""] || selectedModel.type || "";

        // Só atualiza os campos se não estiver editando, ou se estiver editando e o usuário mudou o modelo
        if (!editingTruck || (editingTruck && selectedModelId !== (editingTruck.modelId || editingTruck.model?.id))) {
          setValue("maximumCapacity", selectedModel.maximumCapacity);
          setValue("internalHeight", selectedModel.internalHeight);
          setValue("internalWidth", selectedModel.internalWidth);
          setValue("internalLength", selectedModel.internalLength);
          if (mappedType) {
            setValue("type", mappedType);
          }
        }
      }
    }
  }, [selectedModelId, truckModels, setValue, editingTruck]);

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
    if (!data.status || data.status.trim() === "") {
      return;
    }
    
    const currentModelId = getValues("modelId");
    const formData: TruckData = {
      ...data,
      modelId: currentModelId && String(currentModelId).trim() !== "" ? String(currentModelId) : undefined,
    };
    
    onSubmit(formData);
  };

  const handleFormError = () => {};

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
              <div className="flex flex-col w-full mt-2">
                <label
                  htmlFor="modelId"
                  className="mb-1 text-[#4C2D2D] font-medium"
                >
                  Modelo (opcional)
                </label>
                <select
                  id="modelId"
                  {...register("modelId")}
                  value={watch("modelId") ? String(watch("modelId")) : ""}
                  className="w-full p-2 rounded-lg border-2 border-[#CABAAE] bg-[#E5DAD1] text-[#3F2323] text-sm hover:border-[#4C2D2D] focus:outline-none focus:ring-2 focus:ring-[#744625] transition"
                  onChange={(e) => {
                    const value = e.target.value;
                    const finalValue = value === "" ? undefined : value;
                    setValue("modelId", finalValue as any, { shouldValidate: false, shouldDirty: true, shouldTouch: true });
                  }}
                >
                  <option value="">Selecione um modelo (opcional)</option>
                  {truckModels && truckModels.length > 0 ? (
                    truckModels.map((model) => (
                      <option key={model.id} value={String(model.id)}>
                        {model.name}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>Nenhum modelo disponível</option>
                  )}
                </select>
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
                <Button type="submit">
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