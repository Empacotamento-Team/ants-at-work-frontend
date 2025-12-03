import api from "./axios";
import { Package, Packaging } from "@/types/Package";
import { PackageData } from "@schemas/packageSchema";

function mapPackageFromBackend(data: any): Package {
  let packaging: Packaging | undefined = undefined;
  
  if (data.packaging) {
    if (data.packaging.internalDimensions) {
      packaging = {
        id: data.packaging.id,
        name: data.packaging.name,
        description: data.packaging.description,
        internalDimensions: data.packaging.internalDimensions,
      };
    } else {
      packaging = {
        id: data.packaging.id,
        name: data.packaging.name,
        description: data.packaging.description,
        internalDimensions: {
          height: data.packaging.height ?? 0,
          width: data.packaging.width ?? 0,
          length: data.packaging.length ?? 0,
        }
      };
    }
  }

  return {
    id: data.id,
    loadId: data.loadId,
    packaging: packaging!,
    product: data.product,
    supportedWeight: data.supportedWeight,
    xPosition: data.xPosition,
    yPosition: data.yPosition,
    zPosition: data.zPosition,
    orientation: data.orientation,
  };
}

export const packagesApi = {
  async getAll(
    page: number = 0,
    size: number = 8,
    filters?: { packagingName?: string; productId?: string },
    loadId?: number
  ): Promise<{ packages: Package[]; total: number; totalPages: number; currentPage: number; hasNext: boolean; hasPrevious: boolean }> {
    try {
      const params: any = loadId ? { loadId } : {};
      const response = await api.get("/packages", { params });
      let allPackages: Package[] = Array.isArray(response.data) 
        ? response.data.map(mapPackageFromBackend)
        : [];
      
      if (filters) {
        if (filters.packagingName && filters.packagingName.trim() !== "") {
          const packagingNameLower = filters.packagingName.trim().toLowerCase();
          allPackages = allPackages.filter(pkg => 
            pkg.packaging?.name?.toLowerCase().includes(packagingNameLower)
          );
        }
        if (filters.productId && filters.productId.trim() !== "") {
          const productIdNum = Number(filters.productId);
          if (!isNaN(productIdNum) && productIdNum > 0) {
            allPackages = allPackages.filter(pkg => pkg.product?.id === productIdNum);
          }
        }
      }
      
      const total = allPackages.length;
      const totalPages = Math.ceil(total / size) || 1;
      const startIndex = page * size;
      const endIndex = startIndex + size;
      const paginatedPackages = allPackages.slice(startIndex, endIndex);
      
      return {
        packages: paginatedPackages,
        total,
        totalPages,
        currentPage: page,
        hasNext: endIndex < total,
        hasPrevious: page > 0,
      };
    } catch (error) {
      console.error("Error fetching packages:", error);
      return { packages: [], total: 0, totalPages: 0, currentPage: 0, hasNext: false, hasPrevious: false };
    }
  },

  async getByLoadId(loadId: number): Promise<Package[]> {
    try {
      const response = await api.get(`/packages/by-load/${loadId}`);
      return Array.isArray(response.data) 
        ? response.data.map(mapPackageFromBackend)
        : [];
    } catch (error) {
      console.error("Error fetching packages by load:", error);
      return [];
    }
  },

  async getById(id: number): Promise<Package> {
    const response = await api.get(`/packages/${id}`);
    return mapPackageFromBackend(response.data);
  },

  async create(data: PackageData): Promise<Package> {
    const payload: any = {
      productId: Number(data.productId),
    };

    if (data.packagingId) {
      payload.packagingId = Number(data.packagingId);
    } else if (data.packagingName) {
      payload.packagingName = data.packagingName.trim();
      payload.packagingDescription = data.packagingDescription?.trim() || "";
      payload.packagingHeight = Number(data.packagingHeight);
      payload.packagingWidth = Number(data.packagingWidth);
      payload.packagingLength = Number(data.packagingLength);
    }

    const response = await api.post("/packages", payload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    return mapPackageFromBackend(response.data);
  },

  async update(id: number, data: PackageData): Promise<Package> {
    const payload: any = {
      productId: Number(data.productId),
    };

    if (data.packagingName && data.packagingName.trim() !== "") {
      const height = Number(data.packagingHeight);
      const width = Number(data.packagingWidth);
      const length = Number(data.packagingLength);
      
      if (isNaN(height) || isNaN(width) || isNaN(length) || height <= 0 || width <= 0 || length <= 0) {
        throw new Error("As dimensões da embalagem devem ser números positivos");
      }
      
      payload.packagingName = data.packagingName.trim();
      payload.packagingDescription = data.packagingDescription?.trim() || "";
      payload.packagingHeight = height;
      payload.packagingWidth = width;
      payload.packagingLength = length;
    } else if (data.packagingId) {
      payload.packagingId = Number(data.packagingId);
    }

    const response = await api.put(`/packages/${id}`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    return mapPackageFromBackend(response.data);
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/packages/${id}`);
  },
};

