import { z } from "zod";

export const TruckFamilySchema = z.object({
  name: z
    .string()
    .min(1, { message: "O nome da família é obrigatório" })
    .max(100, { message: "O nome não pode ter mais de 100 caracteres" }),
  
  description: z
    .string()
    .min(1, { message: "A descrição é obrigatória" })
    .max(255, { message: "A descrição não pode ter mais de 255 caracteres" }),

  defaultMaxSupportedWeight: z
    .number({ invalid_type_error: "A capacidade padrão deve ser um número" })
    .min(1, { message: "A capacidade deve ser maior que 0" }),
});

export type TruckFamilyData = z.infer<typeof TruckFamilySchema>;
