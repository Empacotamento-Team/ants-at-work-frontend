import * as z from "zod";


const placaRegex = /^[A-Za-z]{3}[0-9][A-Za-z0-9][0-9]{2}$/;

export const truckSchema = z.object({
  plate: z.string()
    .min(1, { message: "A placa é obrigatória" })
    .regex(placaRegex, { message: "Placa inválida. Use o formato ABC1234 ou ABC1D23." }),
  maximumCapacity: z.coerce.number().positive("A capacidade deve ser um número positivo"),
  internalHeight: z.coerce.number().positive("A altura deve ser um número positivo"),
  internalWidth: z.coerce.number().positive("A largura deve ser um número positivo"),
  internalLength: z.coerce.number().positive("O comprimento deve ser um número positivo"),
  type: z.string().min(1, "Tipo é obrigatório"),
  status: z.string().min(1, "Status é obrigatório"),
  currentMileage: z.coerce.number().positive("A quilometragem deve ser um número positivo"),
  details: z.string().optional(),
  maintenanceNote: z.string().optional(),
});

export type TruckData = z.infer<typeof truckSchema>;