import api from "./axios";
import { Truck } from "@/types/Truck";
import { TruckData } from "@/schemas/truckSchema";

export const trucksApi = {
  async getAll(): Promise<Truck[]> {
    try {
      const response = await api.get("/trucks");
      console.log("GET /trucks response:", response.data);
      
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      if (response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      
      console.warn("Unexpected response format:", response.data);
      return [];
      
    } catch (error: any) {
      return [];
    }
  },

  async getById(id: string): Promise<Truck> {
    const response = await api.get(`/trucks/${id}`);
    return response.data;
  },

  async getTypes(): Promise<string[]> {
    const response = await api.get("/trucks/types");
    return response.data;
  },

  async create(data: TruckData): Promise<Truck> {
    const statusMap: { [key: string]: string } = {
      "ACTIVE": "Ativo",
      "MAINTENANCE": "Em Manutenção", 
      "INACTIVE": "Inativo",
      "active": "Ativo",
      "maintenance": "Em Manutenção", 
      "inactive": "Inativo"
    };

    const typeMap: { [key: string]: string } = {
      "BAU": "Baú",
      "CARRETA": "Carreta",
      "Baú": "Baú",
      "Carreta": "Carreta"
    };

    const payload = {
      plate: data.plate,
      maximumCapacity: data.maximumCapacity,
      internalHeight: data.internalHeight,
      internalWidth: data.internalWidth,
      internalLength: data.internalLength,
      type: typeMap[data.type] || data.type,
      status: statusMap[data.status] || data.status,
      currentMileage: data.currentMileage,
      details: data.details || "",
      maintenanceNote: data.maintenanceNote || "",
    };
    
    try {
      const response = await api.post("/trucks", payload);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  async update(id: string, data: TruckData): Promise<Truck> {
    const statusMap: { [key: string]: string } = {
      "ACTIVE": "Ativo",
      "MAINTENANCE": "Em Manutenção", 
      "INACTIVE": "Inativo",
      "active": "Ativo",
      "maintenance": "Em Manutenção", 
      "inactive": "Inativo"
    };

    const typeMap: { [key: string]: string } = {
      "BAU": "Baú",
      "CARRETA": "Carreta",
      "Baú": "Baú",
      "Carreta": "Carreta"
    };

    const payload = {
      plate: data.plate,
      maximumCapacity: data.maximumCapacity,
      internalHeight: data.internalHeight,
      internalWidth: data.internalWidth,
      internalLength: data.internalLength,
      type: typeMap[data.type] || data.type,
      status: statusMap[data.status] || data.status,
      currentMileage: data.currentMileage,
      details: data.details || "",
      maintenanceNote: data.maintenanceNote || "",
    };
    
    const response = await api.put(`/trucks/${id}`, payload);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/trucks/${id}`);
  },
};