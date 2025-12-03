import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { packagesApi } from "@/api/packages";
import { Package } from "@/types/Package";
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
import { Check, Package as PackageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PackageMultiSelectProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPackagesSelected: (packageIds: number[]) => void;
}

export default function PackageMultiSelect({
  open,
  onOpenChange,
  onPackagesSelected,
}: PackageMultiSelectProps) {
  const [selectedPackages, setSelectedPackages] = useState<number[]>([]);
  const [searchValue, setSearchValue] = useState("");

  const { data: packagesData, isLoading } = useQuery<{ packages: Package[]; total: number; totalPages: number; currentPage: number; hasNext: boolean; hasPrevious: boolean }>({
    queryKey: ["packages", "multiselect", "all"],
    queryFn: async () => {
      try {
        return await packagesApi.getAll(0, 10000); // Buscar todos os pacotes sem paginação
      } catch (error) {
        return { packages: [], total: 0, totalPages: 0, currentPage: 0, hasNext: false, hasPrevious: false };
      }
    },
  });

  // Garantir que packages seja sempre um array
  const packages = Array.isArray(packagesData?.packages) 
    ? packagesData.packages 
    : Array.isArray(packagesData) 
      ? packagesData // Fallback para formato antigo (caso ainda exista em cache)
      : [];

  const filteredPackages = packages.filter(
    (pkg) =>
      pkg.id.toString().includes(searchValue) ||
      pkg.packaging?.name?.toLowerCase().includes(searchValue.toLowerCase()) ||
      pkg.product?.name?.toLowerCase().includes(searchValue.toLowerCase())
  );

  const handlePackageToggle = (packageId: number) => {
    setSelectedPackages((prev) =>
      prev.includes(packageId)
        ? prev.filter((id) => id !== packageId)
        : [...prev, packageId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPackages.length === filteredPackages.length) {
      setSelectedPackages([]);
    } else {
      setSelectedPackages(filteredPackages.map((pkg) => pkg.id));
    }
  };

  const handleConfirm = () => {
    onPackagesSelected(selectedPackages);
    setSelectedPackages([]);
    setSearchValue("");
    onOpenChange(false);
  };

  const handleCancel = () => {
    setSelectedPackages([]);
    setSearchValue("");
    onOpenChange(false);
  };

  useEffect(() => {
    if (!open) {
      setSelectedPackages([]);
      setSearchValue("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Selecionar Pacotes</DialogTitle>
          <DialogDescription>
            Selecione os pacotes que deseja incluir na otimização
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-2">
          <div className="flex items-center justify-between px-2">
            <span className="text-sm text-gray-600">
              {selectedPackages.length} pacote(s) selecionado(s)
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="h-8"
            >
              {selectedPackages.length === filteredPackages.length
                ? "Desselecionar Todos"
                : "Selecionar Todos"}
            </Button>
          </div>

          <Command className="flex-1 overflow-hidden flex flex-col">
            <CommandInput
              placeholder="Buscar pacotes por ID, embalagem ou produto..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList className="flex-1 overflow-auto">
              <CommandEmpty>
                {isLoading ? "Carregando..." : "Nenhum pacote encontrado"}
              </CommandEmpty>
              <CommandGroup>
                {filteredPackages.map((pkg) => {
                  const isSelected = selectedPackages.includes(pkg.id);
                  return (
                    <CommandItem
                      key={pkg.id}
                      value={pkg.id.toString()}
                      onSelect={() => handlePackageToggle(pkg.id)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <div
                        className={cn(
                          "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "opacity-50 [&_svg]:invisible"
                        )}
                      >
                        <Check className="h-4 w-4" />
                      </div>
                      <PackageIcon className="h-4 w-4" />
                      <div className="flex-1">
                        <div className="font-medium">
                          ID: {pkg.id} - {pkg.packaging?.name || "Sem nome"}
                        </div>
                        <div className="text-xs text-gray-500">
                          Produto: {pkg.product?.name || "N/A"}
                        </div>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={selectedPackages.length === 0}>
            Confirmar ({selectedPackages.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

