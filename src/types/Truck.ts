import { TruckModel } from "./TruckModel";
import { Dimensions } from "./Product";

export interface Truck {
  id: string;
  plate: string;
  maximumCapacity: number;
  internalDimensions: Dimensions; // Objeto Dimensions com height, width, length
  type: "BAU" | "CARRETA";
  status: "ACTIVE" | "MAINTENANCE" | "INACTIVE";
  currentMileage: number;
  details: string;
  maintenanceNote: string;
  model?: TruckModel | null;
  modelId?: string | null;
}
