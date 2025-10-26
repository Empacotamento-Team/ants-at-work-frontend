import { useForm } from "react-hook-form";
import { useState } from "react";
import api from "../api/axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { truckSchema, TruckData } from "@schemas/TruckSchema";
import Input from "./Input";
import { Button } from "./Button";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogHeader, DialogContent, DialogTitle, DialogFooter } from "@components/shadcn-ui/Dialog";

type Props = {
  open: boolean;
  onSubmit: (data: TruckData) => void;
  handleOpenChange: (open: boolean) => void;
};

async function fetchTruckTypes() {
  try {
    // const res = await api.get("/truck-types");
    // return res.data;
    return ["Baú"]
  } catch (err) {
    console.error("Falha ao buscar tipos de caminhão:", err);
    return ["Baú", "Sider", "Graneleiro", "Refrigerado"];
  }
}

export default function TruckForm({ open, onSubmit, handleOpenChange }: Props) {
  const [step, setStep] = useState(1);

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<TruckData>({
    resolver: zodResolver(truckSchema),
    mode: "onBlur",
  });

  const { data: truckTypes } = useQuery<string[]>({
    initialData: ["Baú", "Sider", "Graneleiro", "Refrigerado"],
    queryKey: ["truckTypes"],
    queryFn: fetchTruckTypes,
  })

  const handleNextStep = async () => {
    const fieldsToValidate: (keyof TruckData)[] = [
      "plate",
      "model",
      "capacity",
      "length",
      "width",
      "height",
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 p-4">
        <DialogContent className="max-w-10xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-bold text-[#4C2D2D]">
              Etapa {step} de 2:{" "}
              {step === 1 ? "Dados Básicos" : "Dados de Manutenção"}
            </DialogTitle>
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
                text="Modelo"
                id="model"
                type="text"
                placeholder="Insira o modelo..."
                register={register}
                error={errors.model?.message}
              />
              <Input
                text="Capacidade Máxima (kg)"
                id="capacity"
                type="number"
                placeholder="Insira a capacidade em kg..."
                register={register}
                error={errors.capacity?.message}
              />
              <p className="text-[#4C2D2D] font-medium -mb-1">
                Dimensões Internas
              </p>
              <div className="flex gap-2">
                <Input
                  text="Comprimento (m)"
                  id="length"
                  type="number"
                  placeholder="Ex: 14.5"
                  register={register}
                  error={errors.length?.message}
                />
                <Input
                  text="Largura (m)"
                  id="width"
                  type="number"
                  placeholder="Ex: 2.6"
                  register={register}
                  error={errors.width?.message}
                />
                <Input
                  text="Altura (m)"
                  id="height"
                  type="number"
                  placeholder="Ex: 3.1"
                  register={register}
                  error={errors.height?.message}
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
                  htmlFor="detail"
                  className="mb-1 text-[#4C2D2D] font-medium"
                >
                  Detalhes/Sobre
                </label>
                <textarea
                  id="detail"
                  placeholder="Observações adicionais sobre o caminhão..."
                  {...register("detail")}
                  className="w-full p-2 rounded-lg border-2 border-[#CABAAE] bg-[#E5DAD1] text-[#3F2323] text-sm hover:border-[#4C2D2D] focus:outline-none focus:ring-2 focus:ring-[#744625] transition"
                  rows={3}
                />
                {errors.detail && (
                  <p className="text-[#800000] text-xs mt-1 ml-1 font-medium">
                    {errors.detail.message}
                  </p>
                )}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <Input
                text="Última Revisão"
                id="lastRevision"
                type="date"
                placeholder=""
                register={register}
                error={errors.lastRevision?.message}
              />
              <Input
                text="Quilometragem"
                id="mileage"
                type="number"
                placeholder="Insira a quilometragem atual"
                register={register}
                error={errors.mileage?.message}
              />
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
                  Salvar
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}