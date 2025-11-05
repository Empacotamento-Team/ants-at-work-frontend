import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@components/shadcn-ui/Button";
import { Skeleton } from "@components/shadcn-ui/Skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@components/shadcn-ui/Dialog";
import { Input } from "@components/shadcn-ui/Input";
import PageHeader from "@components/PageHeader";
import TruckFamilyCard from "@components/trucks/TruckFamilyCard"; 
import { Loader2 } from "lucide-react";
import api from "@/api/axios";
// Importa o Schema e o Tipo de dados ajustados
import { TruckFamilySchema, TruckFamilyData } from "@/schemas/TruckFamilySchema"; 

// A interface local espelha os dados do schema mais o ID
interface TruckFamily {
  id: string;
  name: string;
  description: string;
  defaultMaxSupportedWeight: number;
}

// --- Funções de API ---
async function fetchTruckFamilies(): Promise<TruckFamily[]> {
  const response = await api.get("/truck-families");
  return response.data;
}

async function createTruckFamily(data: TruckFamilyData) {
  // Os dados enviados estão em conformidade com o TruckFamilySchema (name, description, defaultMaxSupportedWeight)
  const response = await api.post("/truck-families", data);
  return response.data;
}

// --- Componente principal ---
export default function TruckFamilyList() {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  // Query para buscar a lista de famílias
  const { data: families, isLoading: loadingFamilies } = useQuery<TruckFamily[]>({
    queryKey: ["truck-families"],
    queryFn: fetchTruckFamilies,
  });

  // Mutação para criar uma nova família
  const addFamilyMutation = useMutation({
    mutationFn: createTruckFamily,
    onSuccess: () => {
      toast.success("Família de caminhões adicionada com sucesso!");
      setShowForm(false);
      // Invalida a query para recarregar a lista
      queryClient.invalidateQueries({ queryKey: ["truck-families"] });
    },
    onError: () => {
      toast.error("Erro ao adicionar família.");
    },
  });

  // Configuração do formulário com ZodResolver
  const { register, handleSubmit, formState: { errors }, reset } = useForm<TruckFamilyData>({
    resolver: zodResolver(TruckFamilySchema),
  });

  const handleFormSubmit = (data: TruckFamilyData) => {
    // É necessário converter o valor de string (do input) para number antes de enviar
    // O zodResolver do React Hook Form normalmente faz isso com 'type="number"' no input,
    // mas se houver problemas, pode ser necessário um passo de conversão manual aqui:
    const dataToSend = {
        ...data,
        defaultMaxSupportedWeight: Number(data.defaultMaxSupportedWeight),
    };
    addFamilyMutation.mutate(dataToSend);
  };

  const handleOpenChange = (open: boolean) => {
    // Limpa o formulário ao fechar
    if (!open) reset();
    setShowForm(open);
  };

  // --- Renderização do Componente ---
  return (
    <div className="container mx-auto p-8 md:p-8">
      <PageHeader
        title="Gerenciamento de Famílias de Caminhões"
        actions={<Button onClick={() => setShowForm(true)}>Criar Família</Button>}
        topClass="top-11"
      />

      {/* Diálogo/Modal para Adicionar Nova Família */}
      <Dialog open={showForm} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adicionar Nova Família</DialogTitle>
            <DialogDescription>
              Preencha os detalhes abaixo para criar uma nova família de caminhões.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 pt-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">Nome</label>
              <Input id="name" {...register("name")} placeholder="Ex: Família Sudeste" />
              {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1">Descrição</label>
              <Input id="description" {...register("description")} placeholder="Ex: Caminhões com capacidades médias..." />
              {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>}
            </div>
            {/* Campo para a Capacidade Padrão */}
            <div>
              <label htmlFor="defaultMaxSupportedWeight" className="block text-sm font-medium mb-1">Capacidade Padrão (kg)</label>
              {/* O tipo 'number' do input ajuda na validação e formatação no mobile,
                  e o zodResolver deve lidar com a conversão de string para number. */}
              <Input 
                id="defaultMaxSupportedWeight" 
                type="number" 
                {...register("defaultMaxSupportedWeight", { valueAsNumber: true })} 
                placeholder="Ex: 10000" 
              />
              {errors.defaultMaxSupportedWeight && <p className="text-sm text-red-500 mt-1">{errors.defaultMaxSupportedWeight.message}</p>}
            </div>
            <DialogFooter>
              <Button type="submit" disabled={addFamilyMutation.isPending}>
                {addFamilyMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Família
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Lista de Famílias (ou Skeleton de carregamento) */}
      {loadingFamilies ? (
        <div className="space-y-6">
          <Skeleton className="w-full h-[220px] rounded-lg" />
          <Skeleton className="w-full h-[220px] rounded-lg" />
        </div>
      ) : (
        <div className="space-y-6">
          {families?.map((family) => (
            <TruckFamilyCard
              key={family.id}
              familyId={family.id}
              name={family.name}
              description={family.description}
              // Passando a nova propriedade para o componente Card
              defaultMaxSupportedWeight={family.defaultMaxSupportedWeight}
              // Você precisará garantir que o TruckFamilyCard esteja configurado para receber e exibir defaultMaxSupportedWeight
            />
          ))}
        </div>
      )}
    </div>
  );
}