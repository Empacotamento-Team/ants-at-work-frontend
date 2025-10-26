import * as z from "zod";

export const FleetSchema = z.object({
  name: z.string().min(1, { message: "O nome é obrigatório" }),
  code: z.string().min(4, { message: "O código deve ter pelo menos 4 caracteres" }),
  description: z.string().min(1, { message: "A descrição é obrigatória" }),
});

export type FleetData = z.infer<typeof FleetSchema>;
