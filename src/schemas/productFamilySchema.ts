import * as z from "zod";

export const productFamilySchema = z.object({
  name: z.string()
    .min(3, { message: "O nome da família deve ter no mínimo 3 caracteres" })
    .max(255, { message: "O nome da família deve ter no máximo 255 caracteres" }),
  description: z.string()
    .min(1, { message: "A descrição é obrigatória" })
    .max(500, { message: "A descrição deve ter no máximo 500 caracteres" }),
  defaultMaxSupportedWeight: z.coerce.number().positive("O peso máximo suportado por padrão deve ser maior que 0"),
});

export type ProductFamilyData = z.infer<typeof productFamilySchema>;

