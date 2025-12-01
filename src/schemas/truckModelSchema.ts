import * as z from "zod";

export const truckModelSchema = z.object({
  name: z.string()
    .min(1, { message: "O nome do modelo é obrigatório" })
    .max(255, { message: "O nome do modelo deve ter no máximo 255 caracteres" }),
  description: z.string().optional(),
  maximumCapacity: z.coerce.number().positive("A capacidade deve ser um número positivo"),
  internalHeight: z.coerce.number().positive("A altura deve ser um número positivo"),
  internalWidth: z.coerce.number().positive("A largura deve ser um número positivo"),
  internalLength: z.coerce.number().positive("O comprimento deve ser um número positivo"),
  type: z.string().min(1, "Tipo é obrigatório"),
});

export type TruckModelData = z.infer<typeof truckModelSchema>;

