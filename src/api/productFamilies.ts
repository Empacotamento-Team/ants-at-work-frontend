
import api from "./axios";
import { ProductFamily } from "@/types/ProductFamily";
import { ProductFamilyData } from "@/schemas/productFamilySchema";

export const productFamiliesApi = {
  async getAll(
    page: number = 0, 
    size: number = 8,
    filters?: { name?: string; description?: string }
  ): Promise<{ families: ProductFamily[]; total: number; totalPages: number; currentPage: number; hasNext: boolean; hasPrevious: boolean }> {
    try {
      const params: any = { page, size };
      
      if (filters) {
        if (filters.name && filters.name.trim() !== "") {
          params.name = filters.name.trim();
        }
        if (filters.description && filters.description.trim() !== "") {
          params.description = filters.description.trim();
        }
      }
      
      const response = await api.get("/product-families", { params });
      
      const pageData = response.data;
      const families: any[] = pageData?.content || [];
      const total = pageData?.totalElements || 0;
      const totalPages = pageData?.totalPages || 0;
      const currentPage = pageData?.number || 0;
      const hasNext = pageData?.hasNext || false;
      const hasPrevious = pageData?.hasPrevious || false;
      
      if (!families || families.length === 0) {
        return { families: [], total: 0, totalPages: 0, currentPage: 0, hasNext: false, hasPrevious: false };
      }

      const mappedFamilies = families.map((family: any) => {
        const id = family.id ?? family.getId?.() ?? 0;
        const name = family.name ?? family.getName?.() ?? "";
        const description = family.description ?? family.getDescription?.() ?? "";
        const defaultMaxSupportedWeight = family.defaultMaxSupportedWeight ?? family.getDefaultMaxSupportedWeight?.() ?? 0;
        
        return {
          id: Number(id),
          name: String(name),
          description: String(description || ""),
          defaultMaxSupportedWeight: Number(defaultMaxSupportedWeight),
        };
      }).filter((family): family is ProductFamily => family !== null);
      
      return { families: mappedFamilies, total, totalPages, currentPage, hasNext, hasPrevious };
    } catch (error) {
      return { families: [], total: 0, totalPages: 0, currentPage: 0, hasNext: false, hasPrevious: false };
    }
  },

  async getById(id: number): Promise<ProductFamily> {
    const response = await api.get(`/product-families/${id}`);
    const family: any = response.data;

    const familyId = family.id ?? family.getId?.() ?? 0;
    const familyName = family.name ?? family.getName?.() ?? "";
    const familyDescription = family.description ?? family.getDescription?.() ?? "";
    const familyWeight = family.defaultMaxSupportedWeight ?? family.getDefaultMaxSupportedWeight?.() ?? 0;

    return {
      id: Number(familyId),
      name: String(familyName),
      description: String(familyDescription || ""),
      defaultMaxSupportedWeight: Number(familyWeight),
    };
  },

  async create(data: ProductFamilyData): Promise<ProductFamily> {
    const payload = {
      name: data.name.trim(),
      description: data.description.trim(),
      defaultMaxSupportedWeight: Number(data.defaultMaxSupportedWeight),
    };

    const response = await api.post("/product-families", payload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    const family: any = response.data;
    const familyId = family.id ?? family.getId?.() ?? 0;
    const familyName = family.name ?? family.getName?.() ?? "";
    const familyDescription = family.description ?? family.getDescription?.() ?? "";
    const familyWeight = family.defaultMaxSupportedWeight ?? family.getDefaultMaxSupportedWeight?.() ?? 0;

    return {
      id: Number(familyId),
      name: String(familyName),
      description: String(familyDescription || ""),
      defaultMaxSupportedWeight: Number(familyWeight),
    };
  },

  async update(id: number, data: ProductFamilyData): Promise<ProductFamily> {
    const payload = {
      name: data.name.trim(),
      description: data.description.trim(),
      defaultMaxSupportedWeight: Number(data.defaultMaxSupportedWeight),
    };

    const response = await api.put(`/product-families/${id}`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    const family: any = response.data;
    const familyId = family.id ?? family.getId?.() ?? 0;
    const familyName = family.name ?? family.getName?.() ?? "";
    const familyDescription = family.description ?? family.getDescription?.() ?? "";
    const familyWeight = family.defaultMaxSupportedWeight ?? family.getDefaultMaxSupportedWeight?.() ?? 0;

    return {
      id: Number(familyId),
      name: String(familyName),
      description: String(familyDescription || ""),
      defaultMaxSupportedWeight: Number(familyWeight),
    };
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/product-families/${id}`);
  },
};

