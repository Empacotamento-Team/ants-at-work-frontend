import { Package } from "./Package";
import { Truck } from "./Truck";

export interface Load {
  id: number;
  shipmentId?: number;
  relatedTruck: Truck;
  packages: Package[];
  totalAllocatedWeight: number;
  remainingWeight: number;
  totalAllocatedVolume: number;
  volumeOccupationPercentage: number;
  xPosition: number;
  yPosition: number;
  zPosition: number;
}

export interface Shipment {
  id: number;
  loads: Load[];
  createdAt: string;
}

