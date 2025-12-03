export type OptimizationStatus = "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED";

export interface OptimizationQueueItem {
  id: number;
  status: OptimizationStatus;
  attempts: number;
  requestData: string;
  createdAt: string;
  updatedAt: string;
}

export interface Optimization {
  id: number;
  optimizationQueueItemId: number;
  solverStatus: string;
  terminationCondition: string;
  foundSolution: boolean;
  containersUsed: number;
  familyPenality: number;
  gravityCenterDeviation: number;
  createdAt: string;
}

export interface OptimizationRequest {
  fleetId: number;
  packagesIds: number[];
}

