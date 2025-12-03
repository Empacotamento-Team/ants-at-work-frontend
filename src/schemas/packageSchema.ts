import * as z from "zod";

export const packageSchema = z.object({
  packagingId: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    },
    z.number().positive("A embalagem é obrigatória").optional()
  ),
  packagingName: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      return String(val);
    },
    z.string().min(1, "O nome da embalagem é obrigatório").optional()
  ),
  packagingDescription: z.string().optional(),
  packagingHeight: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    },
    z.number().positive("A altura deve ser maior que 0").optional()
  ),
  packagingWidth: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    },
    z.number().positive("A largura deve ser maior que 0").optional()
  ),
  packagingLength: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    },
    z.number().positive("O comprimento deve ser maior que 0").optional()
  ),
  // Informações do package
  productId: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    },
    z.number().positive("O produto é obrigatório")
  ),
}).refine(
  (data) => {
    // Se tem packagingId, está usando embalagem existente
    if (data.packagingId) {
      return true;
    }
    // Se não tem packagingId, precisa ter todos os campos de nova embalagem
    return !!(data.packagingName && data.packagingHeight && data.packagingWidth && data.packagingLength);
  },
  {
    message: "Deve fornecer uma embalagem existente ou criar uma nova com todos os campos preenchidos",
    path: ["packagingId"],
  }
);

export type PackageData = z.infer<typeof packageSchema>;

