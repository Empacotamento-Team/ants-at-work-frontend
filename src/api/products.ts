import api from "./axios";
import { Product, ProductFamily } from "@/types/Product";
import { ProductData } from "@/schemas/productSchema";

export const productsApi = {
  async getAll(
    page: number = 0, 
    size: number = 8,
    filters?: { name?: string; familyId?: string; batch?: string; fragile?: string }
  ): Promise<{ products: Product[]; total: number; totalPages: number; currentPage: number; hasNext: boolean; hasPrevious: boolean }> {
    try {
      const params: any = { page, size };
      
      if (filters) {
        if (filters.name && filters.name.trim() !== "") {
          params.name = filters.name.trim();
        }
        if (filters.familyId && filters.familyId.trim() !== "") {
          const familyIdNum = Number(filters.familyId);
          if (!isNaN(familyIdNum) && familyIdNum > 0) {
            params.familyId = familyIdNum;
          }
        }
        if (filters.batch && filters.batch.trim() !== "") {
          params.batch = filters.batch.trim();
        }
        if (filters.fragile && filters.fragile.trim() !== "") {
          params.fragile = filters.fragile === "true";
        }
      }
      
      const response = await api.get("/products", { params });
      
      const pageData = response.data;
      const products: any[] = pageData?.content || [];
      const total = pageData?.totalElements || 0;
      const totalPages = pageData?.totalPages || 0;
      const currentPage = pageData?.number || 0;
      const hasNext = pageData?.hasNext || false;
      const hasPrevious = pageData?.hasPrevious || false;
      
      if (!products || products.length === 0) {
        return { products: [], total: 0, totalPages: 0, currentPage: 0, hasNext: false, hasPrevious: false };
      }
      
      const mappedProducts = products
        .filter((product: any) => product && product.id)
        .map((product: any) => ({
          id: product.id || 0,
          name: product.name || "",
          family: product.family || { id: product.familyId || 0, name: product.familyName || "" },
          dimensions: {
            height: Number(product.height || product.dimensions?.height || 0),
            width: Number(product.width || product.dimensions?.width || 0),
            length: Number(product.length || product.dimensions?.length || 0),
          },
          weight: Number(product.weight || 0),
          maxSupportedWeight: Number(product.maxSupportedWeight || 0),
          batch: product.batch || undefined,
          fragile: product.fragile || false,
        })) as Product[];
      
      return { products: mappedProducts, total, totalPages, currentPage, hasNext, hasPrevious };
    } catch (error) {
      return { products: [], total: 0, totalPages: 0, currentPage: 0, hasNext: false, hasPrevious: false };
    }
  },

  async getById(id: number): Promise<Product> {
    const response = await api.get(`/products/${id}`);
    const product: any = response.data;
    
    return {
      id: product.id || 0,
      name: product.name || "",
      family: product.family || { id: product.familyId || 0, name: product.familyName || "" },
      dimensions: {
        height: Number(product.height || product.dimensions?.height || 0),
        width: Number(product.width || product.dimensions?.width || 0),
        length: Number(product.length || product.dimensions?.length || 0),
      },
      weight: Number(product.weight || 0),
      maxSupportedWeight: Number(product.maxSupportedWeight || 0),
      batch: product.batch || undefined,
      fragile: product.fragile || false,
    };
  },

  async create(data: ProductData): Promise<Product> {
    const payload = {
      name: data.name.trim(),
      familyId: Number(data.familyId),
      dimensions: {
        height: Number(data.height),
        width: Number(data.width),
        length: Number(data.length),
      },
      weight: Number(data.weight),
      maxSupportedWeight: Number(data.maxSupportedWeight),
      batch: data.batch?.trim() || null,
      fragile: Boolean(data.fragile),
    };
    
    const response = await api.post("/products", payload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    
    const product: any = response.data;
    return {
      id: product.id || 0,
      name: product.name || "",
      family: product.family || { id: product.familyId || 0, name: product.familyName || "" },
      dimensions: {
        height: Number(product.height || product.dimensions?.height || 0),
        width: Number(product.width || product.dimensions?.width || 0),
        length: Number(product.length || product.dimensions?.length || 0),
      },
      weight: Number(product.weight || 0),
      maxSupportedWeight: Number(product.maxSupportedWeight || 0),
      batch: product.batch || undefined,
      fragile: product.fragile || false,
    };
  },

  async update(id: number, data: ProductData): Promise<Product> {
    const payload = {
      name: data.name.trim(),
      familyId: Number(data.familyId),
      dimensions: {
        height: Number(data.height),
        width: Number(data.width),
        length: Number(data.length),
      },
      weight: Number(data.weight),
      maxSupportedWeight: Number(data.maxSupportedWeight),
      batch: data.batch?.trim() || null,
      fragile: Boolean(data.fragile),
    };
    
    const response = await api.put(`/products/${id}`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    
    const product: any = response.data;
    return {
      id: product.id || 0,
      name: product.name || "",
      family: product.family || { id: product.familyId || 0, name: product.familyName || "" },
      dimensions: {
        height: Number(product.height || product.dimensions?.height || 0),
        width: Number(product.width || product.dimensions?.width || 0),
        length: Number(product.length || product.dimensions?.length || 0),
      },
      weight: Number(product.weight || 0),
      maxSupportedWeight: Number(product.maxSupportedWeight || 0),
      batch: product.batch || undefined,
      fragile: product.fragile || false,
    };
  },

  async getByFamilyId(familyId: number): Promise<Product[]> {
    try {
      const response = await api.get(`/products/by-family/${familyId}`);
      return Array.isArray(response.data) 
        ? response.data 
        : response.data?.data || [];
    } catch (error) {
      return [];
    }
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/products/${id}`);
  },

  async getFamilies(): Promise<ProductFamily[]> {
    try {
      const response = await api.get("/product-families");
      const families: any[] = Array.isArray(response.data) 
        ? response.data 
        : response.data?.data || [];
      
      return families
        .map((family: any) => ({
          id: Number(family.id ?? family.getId?.() ?? 0),
          name: String(family.name ?? family.getName?.() ?? ""),
        }))
        .filter((family) => family.id > 0);
    } catch (error) {
      return [];
    }
  },
};

