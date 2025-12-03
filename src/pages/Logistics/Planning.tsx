import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@components/button";
import { toast } from "react-toastify";
import { PageHeader } from "@components/PageHeader";
import PackageMultiSelect from "@components/PackageMultiSelect";
import { optimizationsApi } from "@/api/optimizations";
import { OptimizationQueueItem, Optimization, OptimizationRequest } from "@/types/Optimization";
import { shipmentsApi } from "@/api/shipments";
import { Shipment, Load } from "@/types/Shipment";
import api from "@/api/axios";
import { Clock, CheckCircle2, Loader2, Package as PackageIcon, Truck, XCircle } from "lucide-react";
import { Badge } from "@components/shadcn-ui/Badge";
import Optimization3DView from "@components/Optimization3DView";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@components/shadcn-ui/Dialog";

interface Fleet {
  id: number;
  name: string;
  trucksQuantity: number;
  averageCapacity: number;
  activeTrucks: number;
  underMaintenanceTrucks: number;
}

async function fetchFleets(): Promise<Fleet[]> {
  try {
    const response = await api.get('/fleets', { params: { page: 0, size: 1000 } });
    const pageData = response.data;
    return Array.isArray(pageData?.content) ? pageData.content : [];
  } catch {
    return [];
  }
}

const statusConfig = {
  PENDING: { label: "Aguardando", icon: Clock, color: "bg-yellow-100 text-yellow-800" },
  PROCESSING: { label: "Processando", icon: Loader2, color: "bg-blue-100 text-blue-800" },
  SUCCESS: { label: "Concluído", icon: CheckCircle2, color: "bg-green-100 text-green-800" },
  FAILED: { label: "Falhou", icon: XCircle, color: "bg-red-100 text-red-800" },
};

export default function Planning() {
  const [selectedFleetId, setSelectedFleetId] = useState<number | "">("");
  const [selectedPackageIds, setSelectedPackageIds] = useState<number[]>([]);
  const [showPackageSelect, setShowPackageSelect] = useState(false);
  const [selectedOptimization, setSelectedOptimization] = useState<Optimization | null>(null);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [selectedLoad, setSelectedLoad] = useState<Load | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: fleets = [] } = useQuery<Fleet[]>({
    queryKey: ["fleets", "all"],
    queryFn: fetchFleets,
    refetchOnMount: true, // Recarrega quando a página for montada
  });

  const { data: queueItems = [], isLoading: isLoadingQueue, error: queueError } = useQuery<OptimizationQueueItem[]>({
    queryKey: ["optimization-queue"],
    queryFn: optimizationsApi.getQueueItems,
    refetchInterval: 3000, // Atualiza a cada 3 segundos
  });

  const { data: optimizations = [], isLoading: isLoadingOptimizations } = useQuery<Optimization[]>({
    queryKey: ["optimizations"],
    queryFn: optimizationsApi.getAll,
    refetchInterval: 5000, // Atualiza a cada 5 segundos
  });

  const { data: shipments = [] } = useQuery<Shipment[]>({
    queryKey: ["shipments"],
    queryFn: shipmentsApi.getAll,
    refetchInterval: 5000, // Atualiza a cada 5 segundos
  });

  const createOptimizationMutation = useMutation({
    mutationFn: (request: OptimizationRequest) => optimizationsApi.create(request),
    onSuccess: () => {
      toast.success("Otimização adicionada à fila! Aguarde o processamento...");
      setSelectedFleetId("");
      setSelectedPackageIds([]);
      queryClient.invalidateQueries({ queryKey: ["optimization-queue"] });
      queryClient.invalidateQueries({ queryKey: ["optimizations"] });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || "Erro ao criar otimização. Tente novamente.";
      toast.error(errorMessage);
    },
  });

  const handleCreateOptimization = () => {
    if (!selectedFleetId || selectedPackageIds.length === 0) {
      toast.error("Selecione uma frota e pelo menos um pacote");
      return;
    }

    const request: OptimizationRequest = {
      fleetId: Number(selectedFleetId),
      packagesIds: selectedPackageIds,
    };

    createOptimizationMutation.mutate(request);
  };

  const handleViewResult = async (queueItem: OptimizationQueueItem) => {
    try {
      // Buscar a otimização relacionada a este queue item
      const optimization = (optimizations || []).find((opt: Optimization) => opt.optimizationQueueItemId === queueItem.id);
      if (optimization) {
        const fullOptimization = await optimizationsApi.getById(optimization.id);
        setSelectedOptimization(fullOptimization);
        
        // Buscar o shipment relacionado à optimization usando o endpoint específico
        const shipment = await shipmentsApi.getByOptimizationId(fullOptimization.id);
        if (shipment) {
          setSelectedShipment(shipment);
        } else {
          // Fallback: buscar o shipment mais recente criado após a otimização
          const optimizationDate = new Date(fullOptimization.createdAt);
          const recentShipments = (shipments || [])
            .filter((s: Shipment) => new Date(s.createdAt) >= optimizationDate)
            .sort((a: Shipment, b: Shipment) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          
          if (recentShipments.length > 0) {
            const fallbackShipment = await shipmentsApi.getById(recentShipments[0].id);
            setSelectedShipment(fallbackShipment);
          } else {
            toast.info("Dados de carregamento ainda não disponíveis para esta otimização");
          }
        }
      } else if (queueItem.status === "SUCCESS") {
        // Se está concluído mas ainda não tem otimização, pode estar processando
        toast.info("Aguardando processamento da otimização...");
        // Tentar recarregar os dados
        queryClient.invalidateQueries({ queryKey: ["optimizations"] });
      } else {
        toast.info("Otimização ainda não concluída");
      }
    } catch (error) {
      console.error("Error fetching optimization result:", error);
      toast.error("Erro ao buscar resultado da otimização");
    }
  };

  const getFleetName = (queueItem: OptimizationQueueItem): string => {
    try {
      const requestData = JSON.parse(queueItem.requestData);
      const fleetId = requestData?.fleetId;
      
      if (fleetId != null && fleetId !== '') {
        const fleetIdNum = typeof fleetId === 'string' ? parseInt(fleetId, 10) : Number(fleetId);
        
        if (!isNaN(fleetIdNum) && fleetIdNum > 0 && fleets.length > 0) {
          const fleet = fleets.find(f => Number(f.id) === fleetIdNum);
          
          if (fleet?.name) {
            return `Otimização #${queueItem.id} - ${fleet.name}`;
          }
        }
      }
      
      return `Otimização #${queueItem.id}`;
    } catch {
      return `Otimização #${queueItem.id}`;
    }
  };

  const queueByStatus = {
    PENDING: (queueItems || [])
      .filter((item: OptimizationQueueItem) => item.status === "PENDING")
      .slice(0, 5), // Limitar a 5 registros
    PROCESSING: (queueItems || [])
      .filter((item: OptimizationQueueItem) => item.status === "PROCESSING")
      .slice(0, 5), // Limitar a 5 registros
    SUCCESS: (queueItems || [])
      .filter((item: OptimizationQueueItem) => item.status === "SUCCESS")
      .slice(0, 5), // Limitar a 5 registros
    FAILED: (queueItems || [])
      .filter((item: OptimizationQueueItem) => item.status === "FAILED")
      .slice(0, 5), // Limitar a 5 registros
  };

  return (
    <div className="flex flex-col gap-4 p-6">
      <PageHeader
        title="Planejamento de Carregamento"
        description="Crie otimizações de carregamento para frotas"
      />

      {/* Formulário de Criação */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-[#4C2D2D] mb-4">Nova Otimização</h3>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col w-full">
            <label htmlFor="fleetId" className="mb-1 text-[#4C2D2D] font-medium">
              Frota
            </label>
            <select
              id="fleetId"
              value={selectedFleetId}
              onChange={(e) => setSelectedFleetId(e.target.value ? Number(e.target.value) : "")}
              className="w-full p-2 rounded-lg border-2 border-[#CABAAE] bg-[#E5DAD1] text-[#3F2323] text-sm hover:border-[#4C2D2D] focus:outline-none focus:ring-2 focus:ring-[#744625] transition"
            >
              <option value="">Selecione uma frota</option>
              {fleets.map((fleet) => (
                <option key={fleet.id} value={fleet.id}>
                  {fleet.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col w-full">
            <label className="mb-1 text-[#4C2D2D] font-medium">
              Pacotes
            </label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setShowPackageSelect(true)}
                className="flex-1 justify-start"
              >
                <PackageIcon className="h-4 w-4 mr-2" />
                {selectedPackageIds.length > 0
                  ? `${selectedPackageIds.length} pacote(s) selecionado(s)`
                  : "Selecionar pacotes"}
              </Button>
            </div>
            {selectedPackageIds.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedPackageIds.map((id) => (
                  <Badge key={id} variant="secondary">
                    ID: {id}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Button
            onClick={handleCreateOptimization}
            disabled={!selectedFleetId || selectedPackageIds.length === 0 || createOptimizationMutation.isPending}
            className="w-full"
          >
            {createOptimizationMutation.isPending ? "Criando..." : "Criar Otimização"}
          </Button>
        </div>
      </div>


      {/* Layout de 3 colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Queue */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold text-[#4C2D2D] mb-4">
            Fila de otimizações
            {isLoadingQueue && <span className="text-sm text-gray-500 ml-2">(Carregando...)</span>}
          </h3>
          {isLoadingQueue ? (
            <div className="text-center py-8 text-gray-400">
              <Loader2 className="h-8 w-8 mx-auto animate-spin mb-2" />
              <p>Carregando queue...</p>
            </div>
          ) : queueError ? (
            <div className="text-center py-8 text-red-400">
              <p className="text-sm">Erro ao carregar queue: {String(queueError)}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => queryClient.invalidateQueries({ queryKey: ["optimization-queue"] })}
                className="mt-2"
              >
                Tentar novamente
              </Button>
            </div>
          ) : (
          <div className="space-y-4">
            {/* Aguardando */}
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-2">Aguardando</h4>
              <div className="space-y-2">
                {queueByStatus.PENDING.map((item: OptimizationQueueItem) => {
                  const config = statusConfig[item.status as keyof typeof statusConfig];
                  const Icon = config.icon;
                  return (
                    <div
                      key={item.id}
                      className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleViewResult(item)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span className="font-medium">{getFleetName(item)}</span>
                        </div>
                        <Badge className={config.color}>{config.label}</Badge>
                      </div>
                    </div>
                  );
                })}
                {queueByStatus.PENDING.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">Nenhum item aguardando</p>
                )}
              </div>
            </div>

            {/* Processando */}
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-2">Processando</h4>
              <div className="space-y-2">
                {queueByStatus.PROCESSING.map((item: OptimizationQueueItem) => {
                  const config = statusConfig[item.status as keyof typeof statusConfig];
                  const Icon = config.icon;
                  return (
                    <div
                      key={item.id}
                      className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleViewResult(item)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 animate-spin" />
                          <span className="font-medium">{getFleetName(item)}</span>
                        </div>
                        <Badge className={config.color}>{config.label}</Badge>
                      </div>
                    </div>
                  );
                })}
                {queueByStatus.PROCESSING.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">Nenhum item processando</p>
                )}
              </div>
            </div>

            {/* Concluído */}
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-2">Concluído</h4>
              <div className="space-y-2">
                {queueByStatus.SUCCESS.map((item: OptimizationQueueItem) => {
                  const config = statusConfig[item.status as keyof typeof statusConfig];
                  const Icon = config.icon;
                  return (
                    <div
                      key={item.id}
                      className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleViewResult(item)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span className="font-medium">{getFleetName(item)}</span>
                        </div>
                        <Badge className={config.color}>{config.label}</Badge>
                      </div>
                    </div>
                  );
                })}
                {queueByStatus.SUCCESS.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">Nenhum item concluído</p>
                )}
              </div>
            </div>

            {/* Falhou */}
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-2">Falhou</h4>
              <div className="space-y-2">
                {queueByStatus.FAILED.map((item: OptimizationQueueItem) => {
                  const config = statusConfig[item.status as keyof typeof statusConfig];
                  const Icon = config.icon;
                  return (
                    <div
                      key={item.id}
                      className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleViewResult(item)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span className="font-medium">{getFleetName(item)}</span>
                        </div>
                        <Badge className={config.color}>{config.label}</Badge>
                      </div>
                      {item.attempts > 0 && (
                        <div className="mt-1 text-xs text-gray-500">
                          Tentativas: {item.attempts}
                        </div>
                      )}
                    </div>
                  );
                })}
                {queueByStatus.FAILED.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">Nenhum item falhou</p>
                )}
              </div>
            </div>
          </div>
          )}
        </div>

        {/* Resultado desta execução */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold text-[#4C2D2D] mb-4">
            Resultado desta execução
            {isLoadingOptimizations && <span className="text-sm text-gray-500 ml-2">(Carregando...)</span>}
          </h3>
          {selectedOptimization ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Status do Solver</div>
                  <div className="text-lg font-semibold">{selectedOptimization.solverStatus || "N/A"}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Solução Encontrada</div>
                  <div className="text-lg font-semibold">
                    {selectedOptimization.foundSolution ? "Sim" : "Não"}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Containers Usados</div>
                  <div className="text-lg font-semibold">{selectedOptimization.containersUsed || 0}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Condição de Término</div>
                  <div className="text-lg font-semibold">{selectedOptimization.terminationCondition || "N/A"}</div>
                </div>
              </div>

              {/* Visualização dos Containers */}
              {selectedShipment && selectedShipment.loads && selectedShipment.loads.length > 0 ? (
                <div className="space-y-4">
                  <h4 className="font-semibold text-[#4C2D2D]">Containers (Caminhões) - Clique para visualizar</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedShipment.loads.map((load: Load, index: number) => {
                      const totalPackages = load.packages?.length || 0;
                      // volumeOccupationPercentage pode vir como decimal (0-1) ou porcentagem (0-100)
                      const occupancyValue = load.volumeOccupationPercentage || 0;
                      const occupancyPercent = occupancyValue > 1 
                        ? occupancyValue.toFixed(1) 
                        : (occupancyValue * 100).toFixed(1);
                      
                      // Calcular volume total do caminhão (L × W × H em m³)
                      const truckDims = load.relatedTruck?.internalDimensions;
                      const truckVolume = truckDims 
                        ? (truckDims.length * truckDims.width * truckDims.height).toFixed(2)
                        : "0.00";
                      const isSelected = selectedLoad?.id === load.id;
                      
                      return (
                        <div 
                          key={load.id} 
                          className={`p-4 border rounded-lg bg-gray-50 cursor-pointer transition-all ${
                            isSelected ? "ring-2 ring-blue-500 bg-blue-50" : "hover:bg-gray-100"
                          }`}
                          onClick={() => {
                            setSelectedLoad(load);
                            setIsModalOpen(true);
                          }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Truck className="h-5 w-5 text-[#744625]" />
                              <h5 className="font-semibold">Container C{index + 1}</h5>
                            </div>
                            <Badge variant="secondary">{totalPackages} pacotes</Badge>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Ocupação:</span>
                              <span className="font-medium">{occupancyPercent}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div
                                className="bg-blue-600 h-2.5 rounded-full"
                                style={{ width: `${occupancyPercent}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Peso Total:</span>
                              <span className="font-medium">
                                {load.totalAllocatedWeight ? load.totalAllocatedWeight.toFixed(2) : "0.00"} kg
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Volume Alocado:</span>
                              <span className="font-medium">
                                {load.totalAllocatedVolume ? load.totalAllocatedVolume.toFixed(2) : "0.00"} m³
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Volume Total do Caminhão:</span>
                              <span className="font-medium">
                                {truckVolume} m³
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Caminhão:</span>
                              <span className="font-medium">
                                {load.relatedTruck?.plate || "N/A"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Dimensões (L x W x H):</span>
                              <span className="font-medium text-xs">
                                {load.relatedTruck?.internalDimensions?.length?.toFixed(2) || "0.00"}m × {load.relatedTruck?.internalDimensions?.width?.toFixed(2) || "0.00"}m × {load.relatedTruck?.internalDimensions?.height?.toFixed(2) || "0.00"}m
                              </span>
                            </div>
                          </div>
                          
                          {load.packages && load.packages.length > 0 && (
                            <div className="mt-3 pt-3 border-t">
                              <p className="text-xs text-gray-600 mb-2">Pacotes no container:</p>
                              <div className="grid grid-cols-4 gap-1">
                                {load.packages.map((pkg) => (
                                  <div
                                    key={pkg.id}
                                    className="p-2 bg-white rounded border text-xs text-center"
                                    title={`ID: ${pkg.id}, Produto: ${pkg.product?.name || "N/A"}`}
                                  >
                                    {pkg.id}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : selectedOptimization.foundSolution ? (
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Otimização concluída, mas dados de carregamento ainda não disponíveis.
                  </p>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <PackageIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Selecione uma otimização da fila para ver o resultado</p>
            </div>
          )}
        </div>
      </div>

      <PackageMultiSelect
        open={showPackageSelect}
        onOpenChange={setShowPackageSelect}
        onPackagesSelected={setSelectedPackageIds}
      />

      {/* Modal para visualização 3D */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-7xl w-[95vw] max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Visualização 3D - Container {selectedShipment && selectedShipment.loads && selectedLoad ? selectedShipment.loads.findIndex(l => l.id === selectedLoad.id) + 1 : 1}
            </DialogTitle>
          </DialogHeader>
          {selectedLoad && selectedShipment && (
            <div className="mt-4">
              <Optimization3DView shipment={selectedShipment} selectedLoad={selectedLoad} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

