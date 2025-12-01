import api from "./axios";
import { TruckModel } from "@/types/TruckModel";
import { TruckModelData } from "@/schemas/truckModelSchema";

export const truckModelsApi = {
  async getAll(
    page: number = 0, 
    size: number = 8,
    filters?: { name?: string; type?: string }
  ): Promise<{ models: TruckModel[]; total: number; totalPages: number; currentPage: number; hasNext: boolean; hasPrevious: boolean }> {
    try {
      const params: any = { page, size };
      
      if (filters) {
        if (filters.name && filters.name.trim() !== "") {
          params.name = filters.name.trim();
        }
        if (filters.type && filters.type.trim() !== "") {
          params.type = filters.type.trim();
        }
      }
      
      const response = await api.get("/truck-models", { params });
      
      const pageData = response.data;
      const models: any[] = pageData?.content || [];
      const total = pageData?.totalElements || 0;
      const totalPages = pageData?.totalPages || 0;
      const currentPage = pageData?.number || 0;
      const hasNext = pageData?.hasNext || false;
      const hasPrevious = pageData?.hasPrevious || false;
      
      if (!models || models.length === 0) {
        return { models: [], total: 0, totalPages: 0, currentPage: 0, hasNext: false, hasPrevious: false };
      }
      
      const mappedModels = models.map((model: any) => {
        const typeValue = String(model.defaultTruckType || model.getDefaultTruckType?.() || model.type || "");
        const typeMap: { [key: string]: "BAU" | "CARRETA" | "Baú" | "Carreta" } = {
          "BAU": "BAU",
          "CARRETA": "CARRETA",
          "Baú": "Baú",
          "Carreta": "Carreta",
          "CHEST": "BAU",
          "CART": "CARRETA",
        };
        
        return {
          id: String(model.id || model.getId?.() || ""),
          name: String(model.name || model.getName?.() || ""),
          description: String(model.description || model.getDescription?.() || ""),
          maximumCapacity: Number(model.defaultMaximumCapacity || model.getDefaultMaximumCapacity?.() || model.maximumCapacity || 0),
          internalHeight: Number(model.defaultInternalDimensions?.height || model.defaultInternalDimensions?.getHeight?.() || model.internalHeight || 0),
          internalWidth: Number(model.defaultInternalDimensions?.width || model.defaultInternalDimensions?.getWidth?.() || model.internalWidth || 0),
          internalLength: Number(model.defaultInternalDimensions?.length || model.defaultInternalDimensions?.getLength?.() || model.internalLength || 0),
          type: typeMap[typeValue] || "BAU" as "BAU" | "CARRETA" | "Baú" | "Carreta",
        };
      }).filter((model) => model !== null) as TruckModel[];
      
      return { models: mappedModels, total, totalPages, currentPage, hasNext, hasPrevious };
      
    } catch (error: any) {
      return { models: [], total: 0, totalPages: 0, currentPage: 0, hasNext: false, hasPrevious: false };
    }
  },

  async getById(id: string): Promise<TruckModel> {
    const response = await api.get(`/truck-models/${id}`);
    const model: any = response.data;
    
    const typeValue = String(model.defaultTruckType || model.getDefaultTruckType?.() || model.type || "");
    const typeMap: { [key: string]: "BAU" | "CARRETA" | "Baú" | "Carreta" } = {
      "BAU": "BAU",
      "CARRETA": "CARRETA",
      "Baú": "Baú",
      "Carreta": "Carreta",
      "CHEST": "BAU",
      "CART": "CARRETA",
    };
    
    return {
      id: String(model.id || model.getId?.() || ""),
      name: String(model.name || model.getName?.() || ""),
      description: String(model.description || model.getDescription?.() || ""),
      maximumCapacity: Number(model.defaultMaximumCapacity || model.getDefaultMaximumCapacity?.() || model.maximumCapacity || 0),
      internalHeight: Number(model.defaultInternalDimensions?.height || model.defaultInternalDimensions?.getHeight?.() || model.internalHeight || 0),
      internalWidth: Number(model.defaultInternalDimensions?.width || model.defaultInternalDimensions?.getWidth?.() || model.internalWidth || 0),
      internalLength: Number(model.defaultInternalDimensions?.length || model.defaultInternalDimensions?.getLength?.() || model.internalLength || 0),
      type: typeMap[typeValue] || "BAU" as "BAU" | "CARRETA" | "Baú" | "Carreta",
    };
  },

  async create(data: TruckModelData): Promise<TruckModel> {
    const typeMap: { [key: string]: string } = {
      "BAU": "Baú",
      "CARRETA": "Carreta",
      "Baú": "Baú",
      "Carreta": "Carreta"
    };

    const mappedType = typeMap[data.type] || data.type;

    const payload = {
      name: data.name.trim(),
      description: data.description?.trim() || "",
      defaultMaximumCapacity: data.maximumCapacity,
      defaultInternalHeight: data.internalHeight,
      defaultInternalWidth: data.internalWidth,
      defaultInternalLength: data.internalLength,
      defaultTruckType: mappedType,
    };
    
    const response = await api.post("/truck-models", payload);
    const model: any = response.data;
    
    const typeValue = String(model.defaultTruckType || model.getDefaultTruckType?.() || model.type || "");
    const typeMapResponse: { [key: string]: "BAU" | "CARRETA" | "Baú" | "Carreta" } = {
      "BAU": "BAU",
      "CARRETA": "CARRETA",
      "Baú": "Baú",
      "Carreta": "Carreta",
      "CHEST": "BAU",
      "CART": "CARRETA",
    };
    
    return {
      id: String(model.id || model.getId?.() || ""),
      name: String(model.name || model.getName?.() || ""),
      description: String(model.description || model.getDescription?.() || ""),
      maximumCapacity: Number(model.defaultMaximumCapacity || model.getDefaultMaximumCapacity?.() || model.maximumCapacity || 0),
      internalHeight: Number(model.defaultInternalDimensions?.height || model.defaultInternalDimensions?.getHeight?.() || model.internalHeight || 0),
      internalWidth: Number(model.defaultInternalDimensions?.width || model.defaultInternalDimensions?.getWidth?.() || model.internalWidth || 0),
      internalLength: Number(model.defaultInternalDimensions?.length || model.defaultInternalDimensions?.getLength?.() || model.internalLength || 0),
      type: typeMapResponse[typeValue] || "BAU" as "BAU" | "CARRETA" | "Baú" | "Carreta",
    };
  },

  async update(id: string, data: TruckModelData): Promise<TruckModel> {
    const typeMap: { [key: string]: string } = {
      "BAU": "Baú",
      "CARRETA": "Carreta",
      "Baú": "Baú",
      "Carreta": "Carreta"
    };

    const mappedType = typeMap[data.type] || data.type;

    if (!mappedType || !["Baú", "Carreta"].includes(mappedType)) {
      throw new Error(`Tipo inválido: ${data.type}`);
    }

    const payload: any = {
      name: data.name.trim(),
      defaultMaximumCapacity: data.maximumCapacity,
      defaultInternalHeight: data.internalHeight,
      defaultInternalWidth: data.internalWidth,
      defaultInternalLength: data.internalLength,
      defaultTruckType: mappedType,
    };
    
    if (data.description !== undefined && data.description !== null) {
      payload.description = data.description.trim();
    }
    
    const response = await api.put(`/truck-models/${id}`, payload);
    const model: any = response.data;
    
    const typeValue = String(model.defaultTruckType || model.getDefaultTruckType?.() || model.type || "");
    const typeMapResponse: { [key: string]: "BAU" | "CARRETA" | "Baú" | "Carreta" } = {
      "BAU": "BAU",
      "CARRETA": "CARRETA",
      "Baú": "Baú",
      "Carreta": "Carreta",
      "CHEST": "BAU",
      "CART": "CARRETA",
    };
    
    return {
      id: String(model.id || model.getId?.() || ""),
      name: String(model.name || model.getName?.() || ""),
      description: String(model.description || model.getDescription?.() || ""),
      maximumCapacity: Number(model.defaultMaximumCapacity || model.getDefaultMaximumCapacity?.() || model.maximumCapacity || 0),
      internalHeight: Number(model.defaultInternalDimensions?.height || model.defaultInternalDimensions?.getHeight?.() || model.internalHeight || 0),
      internalWidth: Number(model.defaultInternalDimensions?.width || model.defaultInternalDimensions?.getWidth?.() || model.internalWidth || 0),
      internalLength: Number(model.defaultInternalDimensions?.length || model.defaultInternalDimensions?.getLength?.() || model.internalLength || 0),
      type: typeMapResponse[typeValue] || "BAU" as "BAU" | "CARRETA" | "Baú" | "Carreta",
    };
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/truck-models/${id}`);
  },
};

