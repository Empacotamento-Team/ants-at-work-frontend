import * as z from "zod";

export const productSchema = z.object({
  name: z.string()
    .min(3, { message: "O nome do produto deve ter no mínimo 3 caracteres" })
    .max(255, { message: "O nome do produto deve ter no máximo 255 caracteres" }),
  familyId: z.coerce.number().positive("A família do produto é obrigatória"),
  height: z.coerce.number().positive("A altura deve ser maior que 0"),
  width: z.coerce.number().positive("A largura deve ser maior que 0"),
  length: z.coerce.number().positive("O comprimento deve ser maior que 0"),
  weight: z.coerce.number().positive("O peso deve ser maior que 0"),
  maxSupportedWeight: z.coerce.number().positive("A capacidade máxima de peso deve ser maior que 0"),
  batch: z.string().optional(),
  fragile: z.boolean(),
});

export type ProductData = z.infer<typeof productSchema>;

