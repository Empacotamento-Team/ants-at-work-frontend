import { Dimensions } from "./Product";

export interface Packaging {
  id: number;
  name: string;
  description?: string;
  internalDimensions: Dimensions;
}

export interface ProductInfo {
  id: number;
  name: string;
}

export interface Package {
  id: number;
  loadId?: number;
  packaging: Packaging;
  product: ProductInfo;
  supportedWeight: number;
  xPosition?: number;
  yPosition?: number;
  zPosition?: number;
  orientation?: string;
}

