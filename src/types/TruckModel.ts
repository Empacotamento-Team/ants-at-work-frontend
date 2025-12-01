export interface TruckModel {
  id: string;
  name: string;
  description?: string;
  maximumCapacity: number;
  internalHeight: number;
  internalWidth: number;
  internalLength: number;
  type: "BAU" | "CARRETA" | "Baú" | "Carreta";
}

