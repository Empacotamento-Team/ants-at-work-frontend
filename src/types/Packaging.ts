export interface Packaging {
  id: string;
  name: string;
  description: string;
  internalLength: number;
  internalHeight: number;
  internalWidth: number;
  fleetId: string;
  products: PackagingProduct[];
}

export interface PackagingProduct {
  productId: number;
  quantity: number;
}

