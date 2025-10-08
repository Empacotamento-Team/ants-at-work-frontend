import { TruckData } from "../../schemas/truckSchema";
import { Truck, Gauge, Weight, Wrench, Calendar } from "lucide-react";

interface TruckCardProps {
  truck: TruckData;
}

const getStatusColor = (status?: string) => {
  switch (status) {
    case "active":
      return "text-green-500";
    case "maintenance":
      return "text-yellow-500";
    case "inactive":
      return "text-gray-500";
    default:
      return "text-muted-foreground";
  }
};

export default function TruckCard({ truck }: TruckCardProps) {
  return (
    <div className="border bg-white rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Truck className={`h-6 w-6 text-primary ${getStatusColor(truck.status)}`} />
          <div>
            <h3 className="font-bold text-lg leading-none">{truck.plate}</h3>
            <p className="text-sm text-muted-foreground">{truck.type}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Wrench className="h-4 w-4" />
            <span>Status</span>
          </div>
          <span className={`font-medium ${getStatusColor(truck.status)}`}>{truck.status}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Gauge className="h-4 w-4" />
            <span>Quilometragem</span>
          </div>
          <span className="font-medium">{truck.currentMileage} km</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Weight className="h-4 w-4" />
            <span>Capacidade</span>
          </div>
          <span className="font-medium">{truck.maximumCapacity} kg</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Última Revisão</span>
          </div>
          <span className="font-medium">
            {truck.maintenanceNote ? new Date(truck.maintenanceNote).toLocaleDateString("pt-BR") : "-"}
          </span>
        </div>
      </div>
    </div>
  );
}
