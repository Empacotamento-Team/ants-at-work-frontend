import api from "./axios";
import { Optimization, OptimizationQueueItem, OptimizationRequest } from "@/types/Optimization";

export const optimizationsApi = {
  async getAll(): Promise<Optimization[]> {
    try {
      const response = await api.get("/optimization");
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Error fetching optimizations:", error);
      return [];
    }
  },

  async getById(id: number): Promise<Optimization> {
    const response = await api.get(`/optimization/${id}`);
    return response.data;
  },

  async create(request: OptimizationRequest): Promise<OptimizationQueueItem> {
    const response = await api.post("/optimization", {
      fleetId: request.fleetId,
      packagesIds: request.packagesIds,
    });
    return response.data;
  },

  async getQueueItems(): Promise<OptimizationQueueItem[]> {
    try {
      const response = await api.get("/optimization/queue-items");
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Error fetching queue items:", error);
      return [];
    }
  },
};

