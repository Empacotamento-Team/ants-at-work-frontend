import * as z from "zod";

export const truckModelSchema = z.object({
  name: z.string()
    .min(1, { message: "O nome do modelo é obrigatório" })
    .max(255, { message: "O nome do modelo deve ter no máximo 255 caracteres" }),
  description: z.string().optional(),
  maximumCapacity: z.coerce.number().positive("A capacidade deve ser maior que 0"),
  internalHeight: z.coerce.number().positive("A altura deve ser maior que 0"),
  internalWidth: z.coerce.number().positive("A largura deve ser maior que 0"),
  internalLength: z.coerce.number().positive("O comprimento deve ser maior que 0"),
  type: z.string().min(1, "Tipo é obrigatório"),
});

export type TruckModelData = z.infer<typeof truckModelSchema>;

