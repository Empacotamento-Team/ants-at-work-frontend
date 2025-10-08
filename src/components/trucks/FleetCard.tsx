import { TruckData } from "@schemas/truckSchema";
import TruckCard from "./TruckCard";
import { Separator } from "@components/shadcn-ui/Separator";
import { useNavigate } from "react-router-dom";

interface FleetCardProps {
  fleetId: string;
  name: string;
  trucksQuantity: number;
  averageCapacity: number; 
  activeTrucks: number;
  maintenanceTrucks: number;
  trucks: TruckData[];
}

export default function FleetCard({
  fleetId,
  name,
  trucksQuantity,
  averageCapacity,
  activeTrucks,
  maintenanceTrucks,
  trucks,
}: FleetCardProps) {
  const trucksToShow = trucks.slice(0, 10);
  const navigate = useNavigate();

  return (
    <div 
      onClick={() => navigate(`/fleets/${fleetId}`)}
      className="cursor-pointer">
      <div className="mb-4">
    <div className="min-w-100 border bg-white rounded-lg p-6 shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:border-primary/50 dark:bg-zinc-950 dark:border-zinc-800 dark:hover:border-primary">
      <div className="mb-4">
        <h3 className="text-xl font-semibold leading-none tracking-tight">{name}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {trucksQuantity} caminhões | {activeTrucks} ativos | {maintenanceTrucks} em manutenção | {averageCapacity} kg média de capacidade
        </p>
      </div>
      <Separator className="mb-4" />
      <div>
        <h4 className="text-sm font-medium mb-4 text-muted-foreground">
          Caminhões na Frota ({trucksToShow.length} de {trucksQuantity})
        </h4>
        {trucksToShow.length > 0 ? (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {trucksToShow.map((truck, index) => (
                <TruckCard key={index} truck={truck} />
              ))}
            </div>
            {trucks.length > 10 && (
              <p className="text-xs text-center text-muted-foreground pt-4">
                + {trucks.length - 10} outros caminhões
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum caminhão nesta frota.
          </p>
        )} 
      </div>
    </div>
  </div>
  </div>
  );
}