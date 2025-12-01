import api from "./axios";
import { Truck } from "@/types/Truck";
import { TruckData } from "@/schemas/truckSchema";

function mapTruckType(typeValue: string): "BAU" | "CARRETA" {
  const typeMap: { [key: string]: "BAU" | "CARRETA" } = {
    "Baú": "BAU",
    "Carreta": "CARRETA",
    "CHEST": "BAU",
    "CART": "CARRETA",
  };
  return typeMap[typeValue] || "BAU";
}

function mapTruckStatus(statusValue: string): "ACTIVE" | "MAINTENANCE" | "INACTIVE" {
  const statusMap: { [key: string]: "ACTIVE" | "MAINTENANCE" | "INACTIVE" } = {
    "Ativo": "ACTIVE",
    "Em Manutenção": "MAINTENANCE",
    "Inativo": "INACTIVE",
    "AVAILABLE": "ACTIVE",
    "UNDER_MAINTENANCE": "MAINTENANCE",
    "UNAVAILABLE": "INACTIVE",
  };
  return statusMap[statusValue] || "ACTIVE";
}

function mapTruckResponse(truck: any): Truck {
  const model = truck.model || null;
  const modelId = model?.id || null;
  
  return {
    id: String(truck.id || ""),
    plate: String(truck.plate || ""),
    maximumCapacity: Number(truck.maximumCapacity || 0),
    internalHeight: Number(truck.internalHeight || 0),
    internalWidth: Number(truck.internalWidth || 0),
    internalLength: Number(truck.internalLength || 0),
    type: mapTruckType(String(truck.type || "")),
    status: mapTruckStatus(String(truck.status || "")),
    currentMileage: Number(truck.currentMileage || 0),
    details: String(truck.details || ""),
    maintenanceNote: String(truck.maintenanceNote || ""),
    model: model ? {
      id: String(model.id || ""),
      name: String(model.name || ""),
      description: String(model.description || ""),
      maximumCapacity: Number(model.defaultMaximumCapacity || 0),
      internalHeight: Number(model.defaultInternalDimensions?.height || 0),
      internalWidth: Number(model.defaultInternalDimensions?.width || 0),
      internalLength: Number(model.defaultInternalDimensions?.length || 0),
      type: String(model.defaultTruckType || "") as "BAU" | "CARRETA" | "Baú" | "Carreta",
    } : null,
    modelId: modelId ? String(modelId) : null,
  };
}

export const trucksApi = {
  async getAll(
    page: number = 0, 
    size: number = 8,
    filters?: { plate?: string; type?: string; status?: string; modelId?: string }
  ): Promise<{ trucks: Truck[]; total: number; totalPages: number; currentPage: number; hasNext: boolean; hasPrevious: boolean }> {
    try {
      const params: any = { page, size };
      
      if (filters) {
        if (filters.plate && filters.plate.trim() !== "") {
          params.plate = filters.plate.trim();
        }
        if (filters.type && filters.type.trim() !== "") {
          // Converter enum para descrição em português
          const typeMap: { [key: string]: string } = {
            "BAU": "Baú",
            "CARRETA": "Carreta",
            "Baú": "Baú",
            "Carreta": "Carreta",
          };
          params.type = typeMap[filters.type.trim()] || filters.type.trim();
        }
        if (filters.status && filters.status.trim() !== "") {
          // Converter enum para descrição em português
          const statusMap: { [key: string]: string } = {
            "ACTIVE": "Ativo",
            "MAINTENANCE": "Em Manutenção",
            "INACTIVE": "Inativo",
            "Ativo": "Ativo",
            "Em Manutenção": "Em Manutenção",
            "Inativo": "Inativo",
          };
          params.status = statusMap[filters.status.trim()] || filters.status.trim();
        }
        if (filters.modelId && filters.modelId.trim() !== "") {
          const modelIdNum = Number(filters.modelId);
          if (!isNaN(modelIdNum) && modelIdNum > 0) {
            params.modelId = modelIdNum;
          }
        }
      }
      
      const response = await api.get("/trucks", { params });
      
      const pageData = response.data;
      const trucks: any[] = pageData?.content || [];
      const total = pageData?.totalElements || 0;
      const totalPages = pageData?.totalPages || 0;
      const currentPage = pageData?.number || 0;
      const hasNext = pageData?.hasNext || false;
      const hasPrevious = pageData?.hasPrevious || false;
      
      if (!trucks || trucks.length === 0) {
        return { trucks: [], total: 0, totalPages: 0, currentPage: 0, hasNext: false, hasPrevious: false };
      }
      
      const mappedTrucks = trucks.map((truck: any) => {
        try {
          return mapTruckResponse(truck);
        } catch (error) {
          return null;
        }
      }).filter((truck): truck is Truck => truck !== null);
      
      return { trucks: mappedTrucks, total, totalPages, currentPage, hasNext, hasPrevious };
      
    } catch (error: any) {
      return { trucks: [], total: 0, totalPages: 0, currentPage: 0, hasNext: false, hasPrevious: false };
    }
  },

  async getById(id: string): Promise<Truck> {
    const response = await api.get(`/trucks/${id}`);
    return mapTruckResponse(response.data);
  },

  async getTypes(): Promise<string[]> {
    const response = await api.get("/trucks/types");
    return response.data;
  },

  async create(data: TruckData): Promise<Truck> {
    const statusToDescriptionMap: { [key: string]: string } = {
      "active": "Ativo",
      "maintenance": "Em Manutenção",
      "inactive": "Inativo",
      "ACTIVE": "Ativo",
      "MAINTENANCE": "Em Manutenção",
      "INACTIVE": "Inativo",
      "Ativo": "Ativo",
      "Em Manutenção": "Em Manutenção",
      "Inativo": "Inativo",
      "AVAILABLE": "Ativo",
      "UNDER_MAINTENANCE": "Em Manutenção",
      "UNAVAILABLE": "Inativo",
    };

    const typeToDescriptionMap: { [key: string]: string } = {
      "BAU": "Baú",
      "CARRETA": "Carreta",
      "CHEST": "Baú",
      "CART": "Carreta",
      "Baú": "Baú",
      "Carreta": "Carreta"
    };

    const mappedStatus = statusToDescriptionMap[data.status] || data.status;
    const mappedType = typeToDescriptionMap[data.type] || data.type;

    const payload: any = {
      plate: data.plate,
      maximumCapacity: data.maximumCapacity,
      internalHeight: data.internalHeight,
      internalWidth: data.internalWidth,
      internalLength: data.internalLength,
      type: mappedType,
      status: mappedStatus,
      currentMileage: data.currentMileage,
      details: data.details || "",
      maintenanceNote: data.maintenanceNote || "",
    };
    
    if (data.modelId !== undefined && data.modelId !== null && data.modelId !== "") {
      const modelIdStr = String(data.modelId).trim();
      if (modelIdStr !== "") {
        const modelIdNum = Number(modelIdStr);
        if (!isNaN(modelIdNum) && modelIdNum > 0) {
          payload.modelId = modelIdNum;
        }
      }
    }
    
    try {
      const response = await api.post("/trucks", payload);
      return mapTruckResponse(response.data);
    } catch (error: any) {
      throw error;
    }
  },

  async update(id: string, data: TruckData): Promise<Truck> {
    const statusToDescriptionMap: { [key: string]: string } = {
      "active": "Ativo",
      "maintenance": "Em Manutenção",
      "inactive": "Inativo",
      "ACTIVE": "Ativo",
      "MAINTENANCE": "Em Manutenção",
      "INACTIVE": "Inativo",
      "Ativo": "Ativo",
      "Em Manutenção": "Em Manutenção",
      "Inativo": "Inativo",
      "AVAILABLE": "Ativo",
      "UNDER_MAINTENANCE": "Em Manutenção",
      "UNAVAILABLE": "Inativo",
    };

    const typeToDescriptionMap: { [key: string]: string } = {
      "BAU": "Baú",
      "CARRETA": "Carreta",
      "CHEST": "Baú",
      "CART": "Carreta",
      "Baú": "Baú",
      "Carreta": "Carreta"
    };

    const mappedStatus = statusToDescriptionMap[data.status] || data.status;
    const mappedType = typeToDescriptionMap[data.type] || data.type;

    if (!mappedStatus || !["Ativo", "Em Manutenção", "Inativo"].includes(mappedStatus)) {
      throw new Error(`Status inválido: ${data.status}`);
    }

    if (!mappedType || !["Baú", "Carreta"].includes(mappedType)) {
      throw new Error(`Tipo inválido: ${data.type}`);
    }

    const payload: any = {
      plate: data.plate,
      maximumCapacity: data.maximumCapacity ?? 0,
      internalHeight: data.internalHeight ?? 0,
      internalWidth: data.internalWidth ?? 0,
      internalLength: data.internalLength ?? 0,
      type: mappedType,
      status: mappedStatus,
      currentMileage: data.currentMileage ?? 0,
    };
    
    if (data.modelId && data.modelId.trim() !== "") {
      const modelIdNum = Number(data.modelId);
      if (!isNaN(modelIdNum) && modelIdNum > 0) {
        payload.modelId = modelIdNum;
      }
    }
    
    if (data.details) {
      payload.details = data.details;
    }
    if (data.maintenanceNote) {
      payload.maintenanceNote = data.maintenanceNote;
    }
    
    const response = await api.put(`/trucks/${id}`, payload);
    return mapTruckResponse(response.data);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/trucks/${id}`);
  },
};