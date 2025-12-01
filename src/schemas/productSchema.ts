import * as z from "zod";

export const productSchema = z.object({
  name: z.string()
    .min(3, { message: "O nome do produto deve ter no mínimo 3 caracteres" })
    .max(255, { message: "O nome do produto deve ter no máximo 255 caracteres" }),
  familyId: z.coerce.number().positive("A família do produto é obrigatória"),
  height: z.coerce.number().positive("A altura deve ser um número positivo"),
  width: z.coerce.number().positive("A largura deve ser um número positivo"),
  length: z.coerce.number().positive("O comprimento deve ser um número positivo"),
  weight: z.coerce.number().min(1, "O peso não pode ser negativo ou nulo"),
  maxSupportedWeight: z.coerce.number().min(0, "A capacidade máxima de peso não pode ser negativa"),
  batch: z.string().optional(),
  fragile: z.boolean(),
});

export type ProductData = z.infer<typeof productSchema>;

