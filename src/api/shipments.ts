import api from "./axios";
import { Shipment, Load } from "@/types/Shipment";

export const shipmentsApi = {
  async getAll(): Promise<Shipment[]> {
    try {
      const response = await api.get("/shipments");
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Error fetching shipments:", error);
      return [];
    }
  },

  async getById(id: number): Promise<Shipment> {
    const response = await api.get(`/shipments/${id}`);
    return response.data;
  },

  async getLoadsByShipmentId(shipmentId: number): Promise<Load[]> {
    try {
      const response = await api.get(`/loads/by-shipment/${shipmentId}`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Error fetching loads:", error);
      return [];
    }
  },

  async getByOptimizationId(optimizationId: number): Promise<Shipment | null> {
    try {
      const response = await api.get(`/shipments/by-optimization/${optimizationId}`);
      return response.data;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return null;
      }
      console.error("Error fetching shipment by optimization:", error);
      return null;
    }
  },
};

