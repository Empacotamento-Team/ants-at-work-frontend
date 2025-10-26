import { FC, useState } from "react";
import { FleetData } from "@schemas/FleetSchema";
import { Button } from "@components/shadcn-ui/Button";
import { Separator } from "@components/shadcn-ui/Separator";

interface FleetFormProps {
  open: boolean;
  onSubmit: (data: FleetData) => void;
  onOpenChange: (open: boolean) => void;
}

const FleetForm: FC<FleetFormProps> = ({ open, onSubmit, onOpenChange }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit({ name, description });
    setName("");
    setDescription("");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className="min-w-100 border bg-white dark:bg-zinc-950 rounded-lg p-6 shadow-sm
                   transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:border-primary/50
                   dark:border-zinc-800 dark:hover:border-primary w-full max-w-md"
      >
        <div className="mb-4">
          <h2 className="text-xl font-semibold leading-none tracking-tight">Adicionar Frota</h2>
          <Separator className="my-4" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Nome da Frota"
            className="border p-2 rounded w-full dark:bg-zinc-900 dark:text-white"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <textarea
            placeholder="Descrição da Frota"
            className="border p-2 rounded w-full dark:bg-zinc-900 dark:text-white"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FleetForm;