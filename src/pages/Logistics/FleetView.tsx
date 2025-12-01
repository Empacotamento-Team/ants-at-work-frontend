import { useCallback, useState, useEffect } from "react";
import TruckMultiSelect from "@components/trucks/TruckMultiSelect";
import { TruckData } from "@schemas/truckSchema";
import { Button } from "@components/shadcn-ui/Button";
import { toast } from "react-toastify";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@components/shadcn-ui/Skeleton";
import { ColumnDef } from "@tanstack/react-table";
import { ViewDataTable } from "@components/trucks/ViewDataTable";
import { ArrowLeft, Pencil, Truck as TruckIcon, Wrench, Activity, Gauge, X, Package } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@components/shadcn-ui/Tooltip";
import { useParams, useNavigate } from "react-router-dom";
import FleetIndicator from "@components/trucks/FleetIndicator";
import { Badge } from "@components/shadcn-ui/Badge";
import PageHeader from "@components/PageHeader";
import api from "@/api/axios";
import { Packaging } from "@/types/Packaging";
import { productsApi } from "@/api/products";
import { Product } from "@/types/Product";
import PackagingForm from "@components/PackagingForm";
import TruckForm from "@components/TruckForm";
import { trucksApi } from "@/api/trucks";
import { Truck } from "@/types/Truck";

interface Fleet {
  id: string;
  name: string;
  trucksQuantity: number;
  activeTrucks: number;
  averageCapacity: number;
  underMaintenanceTrucks: number;
  trucksSummary: TruckData[];
}

const statusVariantMap: { [key: string]: "default" | "secondary" | "destructive" } = {
    ['Ativo']: "default",
    ['Em Manutenção']: "secondary",
    ['Inativo']: "destructive",
    ACTIVE: "default",
    MAINTENANCE: "secondary",
    INACTIVE: "destructive",
};

const statusTextMap: { [key: string]: string } = {
    ACTIVE: "Ativo",
    MAINTENANCE: "Em Manutenção",
    INACTIVE: "Inativo",
};

type TruckDataWithModel = TruckData & {
  model?: {
    id: string;
    name: string;
    description: string;
    maximumCapacity: number;
    internalHeight: number;
    internalWidth: number;
    internalLength: number;
    type: "BAU" | "CARRETA" | "Baú" | "Carreta";
  } | null;
  modelId?: string | null;
};

function createTableColumns(
  handleEdit: (truck: TruckDataWithModel) => void,
  handleRemove: (id: string) => void
): ColumnDef<TruckDataWithModel>[] {
  return [
    { accessorKey: "plate", header: "Placa" },
    {
      accessorKey: "model",
      header: "Modelo",
      cell: ({ row }) => {
        const model = row.original.model;
        return model?.name || "-";
      },
    },
    {
      accessorKey: "maximumCapacity",
      header: ({ column }) => {
        return (
          <button
            className="flex items-center gap-1 hover:text-[#744625] transition-colors"
            onClick={() => {
              const isAsc = column.getIsSorted() === "asc";
              column.toggleSorting(isAsc);
            }}
          >
            Capacidade (kg)
            <span className="text-xs">
              {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
            </span>
          </button>
        );
      },
      cell: ({ row }) => `${row.original.maximumCapacity?.toLocaleString('pt-BR')} kg`
    },
    {
      accessorKey: "currentMileage",
      header: ({ column }) => {
        return (
          <button
            className="flex items-center gap-1 hover:text-[#744625] transition-colors"
            onClick={() => {
              const isAsc = column.getIsSorted() === "asc";
              column.toggleSorting(isAsc);
            }}
          >
            Quilometragem
            <span className="text-xs">
              {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
            </span>
          </button>
        );
      },
      cell: ({ row }) => `${row.original.currentMileage?.toLocaleString('pt-BR')} km`
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
          const status = row.original.status;
          const statusText = statusTextMap[status] || status || 'Desconhecido';
          return <Badge variant={statusVariantMap[status] || statusVariantMap[statusText] || 'default'}>{statusText}</Badge>;
      }
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const truck = row.original;
        return (
          <div className="flex gap-2 justify-end">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="cursor-pointer" onClick={() => handleEdit(truck)}>
                  <Pencil className="h-4 w-4"/>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Editar caminhão</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="destructive" size="icon" className="cursor-pointer" onClick={() => handleRemove((truck as any).id || '')}>
                  <X className="h-4 w-4"/>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Remover caminhão</TooltipContent>
            </Tooltip>
          </div>
        );
      },
    },
  ];
}

async function fetchFleetById(fleetId: string): Promise<Fleet | undefined> {
  const response = await api.get(`/fleets/${fleetId}`);
  return response.data;
}

async function handleAddTrucksToFleet(fleetId: string, trucksIds: string[]) {
  const trucksIdsAsNumbers = trucksIds.map(id => Number(id)).filter(id => !isNaN(id) && id > 0);
  const response = await api.post(`/fleets/${fleetId}/trucks`, { trucksIds: trucksIdsAsNumbers });
  return response.data;
}

async function handleRemoveTruckFromFleet(fleetId: string, truckId: string) {
  await api.delete(`/fleets/${fleetId}/trucks`, {
    data: { truckIds: [truckId] },
  });
}

async function fetchFleetTrucks(fleetId: string, page: number = 0, size: number = 6, status?: 'ACTIVE' | 'MAINTENANCE'): Promise<{ trucks: TruckDataWithModel[]; total: number; totalPages: number; currentPage: number; hasNext: boolean; hasPrevious: boolean }> {
  try {
    const params: any = { fleetId: Number(fleetId), page, size };
    if (status) {
      const statusMap: { [key: string]: string } = {
        'ACTIVE': 'Ativo',
        'MAINTENANCE': 'Em Manutenção',
      };
      params.status = statusMap[status] || status;
    }
    const response = await api.get(`/trucks`, { params });
    const pageData = response.data;
    const trucks: any[] = pageData?.content || [];
    const total = pageData?.totalElements || 0;
    const totalPages = pageData?.totalPages || 0;
    const currentPage = pageData?.number || 0;
    const hasNext = pageData?.hasNext || false;
    const hasPrevious = pageData?.hasPrevious || false;
    
    const typeMap: { [key: string]: "BAU" | "CARRETA" } = {
      "Baú": "BAU",
      "Carreta": "CARRETA",
      "CHEST": "BAU",
      "CART": "CARRETA",
      "BAU": "BAU",
      "CARRETA": "CARRETA",
    };
    
    const statusMap: { [key: string]: "ACTIVE" | "MAINTENANCE" | "INACTIVE" } = {
      "Ativo": "ACTIVE",
      "Em Manutenção": "MAINTENANCE",
      "Inativo": "INACTIVE",
      "AVAILABLE": "ACTIVE",
      "UNDER_MAINTENANCE": "MAINTENANCE",
      "UNAVAILABLE": "INACTIVE",
      "ACTIVE": "ACTIVE",
      "MAINTENANCE": "MAINTENANCE",
      "INACTIVE": "INACTIVE",
    };
    
    const mappedTrucks = trucks.map((truck: any) => {
      const truckType = String(truck.type || "");
      const truckStatus = String(truck.status || "");
      const model = truck.model || null;
      
      return {
        id: String(truck.id || ""),
        plate: String(truck.plate || ""),
        maximumCapacity: Number(truck.maximumCapacity || 0),
        internalHeight: Number(truck.internalHeight || 0),
        internalWidth: Number(truck.internalWidth || 0),
        internalLength: Number(truck.internalLength || 0),
        type: typeMap[truckType] || "BAU",
        status: statusMap[truckStatus] || "ACTIVE",
        currentMileage: Number(truck.currentMileage || 0),
        details: String(truck.details || ""),
        maintenanceNote: String(truck.maintenanceNote || ""),
        model: model ? {
          id: String(model.id || ""),
          name: String(model.name || ""),
          description: String(model.description || ""),
          maximumCapacity: Number(model.defaultMaximumCapacity || 0),
          internalHeight: Number(model.defaultInternalDimensions?.height || 0),
          internalWidth: Number(model.defaultInternalDimensions?.width || 0),
          internalLength: Number(model.defaultInternalDimensions?.length || 0),
          type: String(model.defaultTruckType || "") as "BAU" | "CARRETA" | "Baú" | "Carreta",
        } : null,
        modelId: model?.id ? String(model.id) : undefined,
      };
    });
    
    return { trucks: mappedTrucks, total, totalPages, currentPage, hasNext, hasPrevious };
  } catch (error: any) {
    return { trucks: [], total: 0, totalPages: 0, currentPage: 0, hasNext: false, hasPrevious: false };
  }
}

async function fetchProducts(): Promise<Product[]> {
  try {
    const result = await productsApi.getAll(0, 1000);
    return result.products || [];
  } catch {
    return [];
  }
}

async function fetchFleetPackagings(fleetId: string, page: number = 0, size: number = 2): Promise<{ packagings: Packaging[]; total: number; totalPages: number; currentPage: number; hasNext: boolean; hasPrevious: boolean }> {
  try {
    const response = await api.get(`/fleets/${fleetId}/packagings`, {
      params: { page, size },
    });
    const pageData = response.data;
    return {
      packagings: Array.isArray(pageData.content) ? pageData.content : [],
      total: pageData.totalElements || 0,
      totalPages: pageData.totalPages || 0,
      currentPage: pageData.number || 0,
      hasNext: !pageData.last || false,
      hasPrevious: !pageData.first || false,
    };
  } catch {
    return { packagings: [], total: 0, totalPages: 0, currentPage: 0, hasNext: false, hasPrevious: false };
  }
}

async function createPackaging(fleetId: string, data: any): Promise<Packaging> {
  const response = await api.post(`/fleets/${fleetId}/packagings`, {
    name: String(data.name || "").trim(),
    description: String(data.description || "").trim(),
    internalLength: Number(data.internalLength) || 0,
    internalHeight: Number(data.internalHeight) || 0,
    internalWidth: Number(data.internalWidth) || 0,
    products: Array.isArray(data.products) 
      ? data.products
          .filter((p: any) => p && p.productId != null)
          .map((p: any) => ({
            productId: Number(p.productId),
            quantity: Number(p.quantity) || 1,
          }))
      : [],
  });
  return response.data;
}

export default function FleetView() {
  const [showForm, setShowForm] = useState(false);
  const [showPackagingForm, setShowPackagingForm] = useState(false);
  const [showTruckEditForm, setShowTruckEditForm] = useState(false);
  const [editingTruck, setEditingTruck] = useState<Truck | null>(null);
  const [filtering, setFiltering] = useState<'all' | 'active' | 'maintenance'>('all');
  const [packagingRefreshKey, setPackagingRefreshKey] = useState(0);
  const [trucksCurrentPage, setTrucksCurrentPage] = useState(0);
  const [trucksPageSize, setTrucksPageSize] = useState(6);
  const [packagingsCurrentPage, setPackagingsCurrentPage] = useState(0);
  const [packagingsPageSize, setPackagingsPageSize] = useState(2);
  const { fleetId } = useParams<{ fleetId: string }>(); 
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: allProducts } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  const { data: fleet, isPending: isLoading, isError } = useQuery<Fleet | undefined>({
    queryKey: ["fleet", fleetId], 
    queryFn: () => fetchFleetById(fleetId!),
    enabled: !!fleetId, 
    retry: false,
  });

  const { data: trucksData, isLoading: isLoadingTrucks } = useQuery<{ trucks: TruckDataWithModel[]; total: number; totalPages: number; currentPage: number; hasNext: boolean; hasPrevious: boolean }>({
    queryKey: ["fleet-trucks", fleetId, trucksCurrentPage, trucksPageSize, filtering],
    queryFn: () => {
      const status = filtering === 'active' ? 'ACTIVE' : filtering === 'maintenance' ? 'MAINTENANCE' : undefined;
      return fetchFleetTrucks(fleetId!, trucksCurrentPage, trucksPageSize, status);
    },
    enabled: !!fleetId,
    staleTime: 0,
    refetchOnMount: true,
  });

  const fleetTrucks = trucksData?.trucks || [];
  
  const trucksTotalPages = trucksData?.totalPages || 0;
  const trucksHasNext = trucksCurrentPage < trucksTotalPages - 1;
  const trucksHasPrevious = trucksCurrentPage > 0;

  const truckMutation = useMutation({
    mutationKey: ["add-trucks-to-fleet", fleetId],
    mutationFn: (trucksIds: string[]) => handleAddTrucksToFleet(fleetId!, trucksIds),
    onSuccess: () => {
      toast.success(`Caminhão(ões) adicionado(s) à frota com sucesso!`);
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['fleet', fleetId] });
      queryClient.invalidateQueries({ queryKey: ['fleet-trucks', fleetId] });
      setTrucksCurrentPage(0);
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || "Erro ao adicionar caminhões à frota.";
      toast.error(errorMessage);
    },
  });

  const removeFromFleetMutation = useMutation({
    mutationKey: ["remove-truck", fleetId],
    mutationFn: (truckId: string) => handleRemoveTruckFromFleet(fleetId!, truckId),
    onSuccess: () => {
      toast.success("Caminhão removido com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['fleet', fleetId] });
      queryClient.invalidateQueries({ queryKey: ['fleet-trucks', fleetId] });
      setTrucksCurrentPage(0);
    },
    onError: () => {
      toast.error("Erro ao remover caminhão da frota. Tente novamente.");
    },
  });

  const updateTruckMutation = useMutation({
    mutationKey: ["update-truck", fleetId],
    mutationFn: (data: { id: string; data: TruckData }) => trucksApi.update(data.id, data.data),
    onSuccess: () => {
      toast.success("Caminhão atualizado com sucesso!");
      setShowTruckEditForm(false);
      setEditingTruck(null);
      queryClient.invalidateQueries({ queryKey: ['fleet', fleetId] });
      queryClient.invalidateQueries({ queryKey: ['fleet-trucks', fleetId] });
      queryClient.invalidateQueries({ queryKey: ['trucks'] });
    },
    onError: () => {
      toast.error("Erro ao atualizar caminhão. Tente novamente.");
    },
  });

  const { data: packagingsData } = useQuery<{ packagings: Packaging[]; total: number; totalPages: number; currentPage: number; hasNext: boolean; hasPrevious: boolean }>({
    queryKey: ["fleet-packagings", fleetId, packagingsCurrentPage, packagingsPageSize, packagingRefreshKey],
    queryFn: () => fetchFleetPackagings(fleetId!, packagingsCurrentPage, packagingsPageSize),
    enabled: !!fleetId,
    staleTime: 0,
    refetchOnMount: true,
  });

  const allPackagings = packagingsData?.packagings || [];
  const packagingsTotal = packagingsData?.total || 0;
  const packagingsTotalPages = packagingsData?.totalPages || 0;
  const packagingsHasNext = packagingsData?.hasNext || false;
  const packagingsHasPrevious = packagingsData?.hasPrevious || false;

  const addPackagingMutation = useMutation({
    mutationFn: ({ fleetId, data }: { fleetId: string; data: any }) => createPackaging(fleetId, data),
    onSuccess: () => {
      toast.success("Embalagem adicionada com sucesso!");
      setShowPackagingForm(false);
      setPackagingRefreshKey((prev: number) => prev + 1);
      queryClient.invalidateQueries({ queryKey: ["fleet", fleetId] });
      queryClient.invalidateQueries({ queryKey: ["fleet-packagings", fleetId] });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Erro ao adicionar embalagem. Tente novamente.";
      toast.error(errorMessage);
    },
  });

  const handleRemove = useCallback((id: string) => {
    if (window.confirm("Tem certeza que deseja remover este caminhão da frota?")) {
      removeFromFleetMutation.mutate(id);
    }
  }, [removeFromFleetMutation]);

  const handleEditTruck = useCallback((truck: TruckDataWithModel) => {
    const typeMap: { [key: string]: "BAU" | "CARRETA" } = {
      "BAU": "BAU",
      "CARRETA": "CARRETA",
      "Baú": "BAU",
      "Carreta": "CARRETA",
      "baú": "BAU",
      "carreta": "CARRETA",
    };

    const statusMap: { [key: string]: "ACTIVE" | "MAINTENANCE" | "INACTIVE" } = {
      "ACTIVE": "ACTIVE",
      "MAINTENANCE": "MAINTENANCE",
      "INACTIVE": "INACTIVE",
      "UNDER_MAINTENANCE": "MAINTENANCE",
      "AVAILABLE": "ACTIVE",
      "Ativo": "ACTIVE",
      "Em Manutenção": "MAINTENANCE",
      "Manutenção": "MAINTENANCE",
      "Inativo": "INACTIVE",
      "ativo": "ACTIVE",
      "em manutenção": "MAINTENANCE",
      "manutenção": "MAINTENANCE",
      "inativo": "INACTIVE",
    };

    const mappedType = typeMap[truck.type || ""] || "BAU";
    const mappedStatus = statusMap[truck.status || ""] || "ACTIVE";

    const truckToEdit: Truck = {
      id: (truck as any).id || '',
      plate: truck.plate || '',
      maximumCapacity: truck.maximumCapacity || 0,
      internalHeight: truck.internalHeight || 0,
      internalWidth: truck.internalWidth || 0,
      internalLength: truck.internalLength || 0,
      type: mappedType,
      status: mappedStatus,
      currentMileage: truck.currentMileage || 0,
      details: truck.details || '',
      maintenanceNote: truck.maintenanceNote || '',
    };
    setEditingTruck(truckToEdit);
    setShowTruckEditForm(true);
  }, []);

  const handleTruckFormClose = useCallback((open: boolean) => {
    setShowTruckEditForm(open);
    if (!open) {
      setEditingTruck(null);
    }
  }, []);

  const handleTruckFormSubmit = useCallback((data: TruckData) => {
    if (!editingTruck || !editingTruck.id) {
      toast.error("Erro: ID do caminhão não encontrado.");
      return;
    }
    updateTruckMutation.mutate({ id: editingTruck.id, data });
  }, [editingTruck, updateTruckMutation]);

  const handleFilterChange = useCallback((filterMode: 'active' | 'maintenance') => {
    if (filtering === filterMode) {
      setFiltering('all');
    } else {
      setFiltering(filterMode);
    }
  }, [filtering]);

  const handlePackagingSubmit = (data: any) => {
    if (!fleetId) return;
    addPackagingMutation.mutate({ fleetId, data });
  };


  const tableColumns = createTableColumns(
    handleEditTruck,
    (id) => handleRemove(id)
  );

  useEffect(() => {
    setTrucksCurrentPage(0);
  }, [filtering]);

  useEffect(() => {
    setPackagingsCurrentPage(0);
  }, [packagingRefreshKey]);

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="w-full h-[40vh]" />
      </div>
    );
  }

  if (isError || !fleet) {
    return (
        <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
            <p className="text-xl text-muted-foreground">Frota não encontrada.</p>
            <Button onClick={() => navigate("/fleets")}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Frotas
            </Button>
        </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-4">
        <Button onClick={() => navigate("/fleets")} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
      </div>

      <PageHeader
        title={`${fleet.name}`}
        actions={<Button onClick={() => setShowForm(true)}>Adicionar Caminhão</Button>}
        topClass="top-11"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <FleetIndicator cardTitle="Total de Caminhões" icon={TruckIcon} indicatorValue={fleet.trucksQuantity}
          subtitle="veículos na frota"/>
        <FleetIndicator cardTitle="Caminhões Ativos" icon={Activity} indicatorValue={fleet.activeTrucks} specialColor="var(--color-green-600)" 
          subtitle={fleet.trucksQuantity > 0 ? `${Math.round((fleet.activeTrucks / fleet.trucksQuantity) * 100)}% da frota` : '0% da frota'}
          onClick={() => handleFilterChange('active')} active={filtering === 'active'}/>
        <FleetIndicator cardTitle="Em Manutenção" icon={Wrench} indicatorValue={fleet.underMaintenanceTrucks} specialColor="var(--color-yellow-600)" 
          subtitle={fleet.trucksQuantity > 0 ? `${Math.round((fleet.underMaintenanceTrucks / fleet.trucksQuantity) * 100)}% da frota` : '0% da frota'}
          onClick={() => handleFilterChange('maintenance')} active={filtering === 'maintenance'}/>
        <FleetIndicator cardTitle="Capacidade Média" icon={Gauge} indicatorValue={fleet.averageCapacity?.toLocaleString('pt-BR')} 
          subtitle="kg por veículo"/>
      </div>
      
      <ViewDataTable columns={tableColumns} data={fleetTrucks || []} isLoading={isLoadingTrucks} />
      {!isLoadingTrucks && fleetTrucks.length > 0 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  const newPage = Math.max(0, trucksCurrentPage - 1);
                  setTrucksCurrentPage(newPage);
                }}
                disabled={!trucksHasPrevious}
                className="px-4"
              >
                Anterior
              </Button>
              <span className="text-sm text-[#4C2D2D]">
                Página {trucksCurrentPage + 1} de {trucksTotalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => {
                  if (trucksTotalPages > 0) {
                    const newPage = Math.min(trucksTotalPages - 1, trucksCurrentPage + 1);
                    setTrucksCurrentPage(newPage);
                  }
                }}
                disabled={!trucksHasNext || trucksTotalPages === 0}
                className="px-4"
              >
                Próximo
              </Button>
              <div className="flex items-center gap-2 ml-4">
                <label htmlFor="trucksPageSize" className="text-sm text-[#4C2D2D]">
                  Por página:
                </label>
                <input
                  id="trucksPageSize"
                  type="number"
                  min="1"
                  value={trucksPageSize}
                  onChange={(e) => {
                    const newSize = Math.max(1, parseInt(e.target.value) || 6);
                    setTrucksPageSize(newSize);
                    setTrucksCurrentPage(0);
                  }}
                  className="w-20 p-2 rounded-lg border-2 border-[#CABAAE] bg-[#E5DAD1] text-[#3F2323] text-sm focus:outline-none focus:ring-2 focus:ring-[#744625]"
                />
              </div>
            </div>
          )}

      <div className="mb-6 mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Package className="h-5 w-5" />
            Embalagens da Frota
          </h2>
          <Button onClick={() => setShowPackagingForm(true)} size="sm">
            Adicionar Embalagem
          </Button>
        </div>
        {allPackagings.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allPackagings.map((packaging: Packaging) => {
              const packagingLength = Number(packaging.internalLength) || 0;
              const packagingWidth = Number(packaging.internalWidth) || 0;
              const packagingHeight = Number(packaging.internalHeight) || 0;
              const packagingVolumeCm3 = packagingLength * packagingWidth * packagingHeight;
              const packagingVolumeM3 = packagingVolumeCm3 / 1000000;
              
              const productsVolumeCm3 = packaging.products.reduce((sum: number, p: any) => {
                const product = allProducts?.find((prod) => prod.id === p.productId);
                if (!product || !product.dimensions) return sum;
                
                const productLength = Number(product.dimensions.length) || 0;
                const productWidth = Number(product.dimensions.width) || 0;
                const productHeight = Number(product.dimensions.height) || 0;
                const productVolumeCm3 = productLength * productWidth * productHeight;
                
                return sum + (productVolumeCm3 * Number(p.quantity));
              }, 0);
              
              const productsVolumeM3 = productsVolumeCm3 / 1000000;
              
              const totalWeight = packaging.products.reduce((sum: number, p: any) => {
                const product = allProducts?.find((prod) => prod.id === p.productId);
                if (!product) return sum;
                return sum + (Number(product.weight) * Number(p.quantity));
              }, 0);

              return (
                <div
                  key={packaging.id}
                  className="bg-white dark:bg-gray-800 p-4 rounded-lg border shadow-sm"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-[#4C2D2D] dark:text-white">
                      {packaging.name}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {packaging.products.length} produto{packaging.products.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                  
                  {packaging.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {packaging.description}
                    </p>
                  )}

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Dimensões Internas:</span>
                      <span className="font-medium">
                        {packagingLength} x {packagingWidth} x {packagingHeight} cm
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Volume da Embalagem:</span>
                      <span className="font-medium">
                        {isNaN(packagingVolumeM3) || packagingVolumeM3 <= 0 ? "0.00" : packagingVolumeM3.toFixed(2)} m³
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Volume Ocupado (Produtos):</span>
                      <span className="font-medium">
                        {isNaN(productsVolumeM3) || productsVolumeM3 <= 0 ? "0.00" : productsVolumeM3.toFixed(2)} m³
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Peso Total (Produtos):</span>
                      <span className="font-medium">
                        {isNaN(totalWeight) || totalWeight <= 0 ? "0.00" : totalWeight.toFixed(2)} kg
                      </span>
                    </div>
                  </div>

                  {packaging.products.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Produtos:</p>
                      <div className="flex flex-wrap gap-1">
                        {packaging.products.map((p) => {
                          const product = allProducts?.find((prod) => prod.id === p.productId);
                          return (
                            <span
                              key={p.productId}
                              className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded"
                              title={product?.name || `Produto ID: ${p.productId}`}
                            >
                              {product?.name || `ID: ${p.productId}`} (x{p.quantity})
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            </div>
            {packagingsTotal > 0 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const newPage = Math.max(0, packagingsCurrentPage - 1);
                    setPackagingsCurrentPage(newPage);
                  }}
                  disabled={!packagingsHasPrevious}
                  className="px-4"
                >
                  Anterior
                </Button>
                <span className="text-sm text-[#4C2D2D]">
                  Página {packagingsCurrentPage + 1} de {packagingsTotalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (packagingsTotalPages > 0) {
                      const newPage = Math.min(packagingsTotalPages - 1, packagingsCurrentPage + 1);
                      setPackagingsCurrentPage(newPage);
                    }
                  }}
                  disabled={!packagingsHasNext || packagingsTotalPages === 0}
                  className="px-4"
                >
                  Próximo
                </Button>
                <div className="flex items-center gap-2 ml-4">
                  <label htmlFor="packagingsPageSize" className="text-sm text-[#4C2D2D]">
                    Por página:
                  </label>
                  <input
                    id="packagingsPageSize"
                    type="number"
                    min="1"
                    value={packagingsPageSize}
                    onChange={(e) => {
                      const newSize = Math.max(1, parseInt(e.target.value) || 2);
                      setPackagingsPageSize(newSize);
                      setPackagingsCurrentPage(0);
                    }}
                    className="w-20 p-2 rounded-lg border-2 border-[#CABAAE] bg-[#E5DAD1] text-[#3F2323] text-sm focus:outline-none focus:ring-2 focus:ring-[#744625]"
                  />
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg border text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">
              Nenhuma embalagem cadastrada nesta frota.
            </p>
          </div>
        )}
      </div>
      
      <TruckMultiSelect
        open={showForm}
        onOpenChange={setShowForm}
        onTrucksSelected={truckMutation.mutate}
      />

      {fleetId && (
        <PackagingForm
          open={showPackagingForm}
          onOpenChange={setShowPackagingForm}
          onSubmit={handlePackagingSubmit}
          fleetId={fleetId}
        />
      )}

      <TruckForm
        open={showTruckEditForm}
        handleOpenChange={handleTruckFormClose}
        onSubmit={handleTruckFormSubmit}
        editingTruck={editingTruck}
      />
    </div>
  );
}
