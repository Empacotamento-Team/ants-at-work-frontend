import { TruckModel } from "./TruckModel";

export interface Truck {
  id: string;
  plate: string;
  maximumCapacity: number;
  internalHeight: number;
  internalWidth: number;
  internalLength: number;
  type: "BAU" | "CARRETA";
  status: "ACTIVE" | "MAINTENANCE" | "INACTIVE";
  currentMileage: number;
  details: string;
  maintenanceNote: string;
  model?: TruckModel | null;
  modelId?: string | null;
}
