export interface ProductFamily {
  id: number;
  name: string;
}

export interface Dimensions {
  height: number;
  width: number;
  length: number;
}

export interface Product {
  id: number;
  name: string;
  family: ProductFamily;
  dimensions: Dimensions;
  weight: number;
  maxSupportedWeight: number;
  batch?: string;
  fragile: boolean;
}

