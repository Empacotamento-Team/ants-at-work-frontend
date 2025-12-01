import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { trucksApi } from "@/api/trucks";
import { Truck } from "@/types/Truck";
import { Button } from "@/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/shadcn-ui/Dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, Truck as TruckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface TruckMultiSelectProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTrucksSelected: (truckIds: string[]) => void;
}

export default function TruckMultiSelect({
  open,
  onOpenChange,
  onTrucksSelected,
}: TruckMultiSelectProps) {
  const [selectedTrucks, setSelectedTrucks] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState("");

  const { data: trucksData, isLoading } = useQuery<{ trucks: Truck[]; total: number; totalPages: number; currentPage: number; hasNext: boolean; hasPrevious: boolean }>({
    queryKey: ["trucks", "all"],
    queryFn: async () => {
      try {
        const result = await trucksApi.getAll(0, 1000);
        return result;
      } catch (error) {
        return { trucks: [], total: 0, totalPages: 0, currentPage: 0, hasNext: false, hasPrevious: false };
      }
    },
  });

  const availableTrucks = trucksData?.trucks || [];

  const filteredTrucks = availableTrucks.filter(
    (truck) =>
      truck.plate.toLowerCase().includes(searchValue.toLowerCase()) ||
      (truck.type === "BAU" ? "Baú" : "Carreta")
        .toLowerCase()
        .includes(searchValue.toLowerCase())
  );

  const handleTruckToggle = (truckId: string) => {
    setSelectedTrucks((prev) =>
      prev.includes(truckId)
        ? prev.filter((id) => id !== truckId)
        : [...prev, truckId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTrucks.length === filteredTrucks.length) {
      setSelectedTrucks([]);
    } else {
      setSelectedTrucks(filteredTrucks.map((truck) => truck.id));
    }
  };

  const handleConfirm = () => {
    onTrucksSelected(selectedTrucks);
    setSelectedTrucks([]);
    setSearchValue("");
    onOpenChange(false);
  };

  const handleCancel = () => {
    setSelectedTrucks([]);
    setSearchValue("");
    onOpenChange(false);
  };

  useEffect(() => {
    if (!open) {
      setSelectedTrucks([]);
      setSearchValue("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TruckIcon className="h-5 w-5" />
            Adicionar Caminhões à Frota
          </DialogTitle>
          <DialogDescription>
            Selecione os caminhões que deseja adicionar à frota. Você pode pesquisar por placa ou tipo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {selectedTrucks.length} caminhão(ões) selecionado(s)
            </p>
            {filteredTrucks.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                {selectedTrucks.length === filteredTrucks.length
                  ? "Desmarcar Todos"
                  : "Selecionar Todos"}
              </Button>
            )}
          </div>

          <Command className="border rounded-md">
            <CommandInput
              placeholder="Pesquisar por placa ou tipo..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList className="max-h-[260px] overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-gray-500">
                  Carregando caminhões...
                </div>
              ) : filteredTrucks.length === 0 ? (
                <CommandEmpty>
                  {searchValue
                    ? "Nenhum caminhão encontrado."
                    : "Nenhum caminhão disponível."}
                </CommandEmpty>
              ) : (
                <CommandGroup>
                  {filteredTrucks.map((truck) => (
                    <CommandItem
                      key={truck.id}
                      value={`${truck.plate} ${
                        truck.type === "BAU" ? "Baú" : "Carreta"
                      }`}
                      onSelect={() => handleTruckToggle(truck.id)}
                      className="flex items-center justify-between p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                            selectedTrucks.includes(truck.id)
                              ? "bg-primary text-primary-foreground"
                              : "opacity-50 [&_svg]:invisible"
                          )}
                        >
                          <Check className="h-3 w-3" />
                        </div>
                        <div>
                          <div className="font-medium">{truck.plate}</div>
                          <div className="text-sm text-gray-500">
                            {truck.type === "BAU" ? "Baú" : "Carreta"} •{" "}
                            {truck.maximumCapacity}kg
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {truck.status === "ACTIVE"
                          ? "Ativo"
                          : truck.status === "MAINTENANCE"
                          ? "Manutenção"
                          : "Inativo"}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </div>

        <DialogFooter className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={selectedTrucks.length === 0}>
            Adicionar {selectedTrucks.length} Caminhão(ões)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
