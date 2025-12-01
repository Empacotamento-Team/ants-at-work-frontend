import { useEffect } from "react";
import { useForm, UseFormRegister, FieldValues } from "react-hook-form";
import { Dialog, DialogHeader, DialogContent, DialogTitle, DialogFooter, DialogDescription } from "@components/shadcn-ui/Dialog";
import { Button } from "./button";
import Input from "./Input";

export type FilterFieldType = 
  | { type: "text"; id: string; label: string; placeholder?: string }
  | { type: "select"; id: string; label: string; options: { value: string; label: string }[] }
  | { type: "asyncSelect"; id: string; label: string; options: { value: string; label: string }[]; isLoading?: boolean };

export type FilterConfig<T extends Record<string, any>> = {
  title: string;
  description: string;
  fields: FilterFieldType[];
  defaultValues: T;
};

type Props<T extends Record<string, any>> = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyFilters: (filters: T) => void;
  config: FilterConfig<T>;
  initialFilters: T;
};

export default function FilterModal<T extends Record<string, any>>({
  open,
  onOpenChange,
  onApplyFilters,
  config,
  initialFilters,
}: Props<T>) {
  const { register, handleSubmit, reset } = useForm<FieldValues>({
    defaultValues: initialFilters || config.defaultValues,
  });

  useEffect(() => {
    reset(initialFilters || config.defaultValues);
  }, [initialFilters, reset, open, config.defaultValues]);

  const onSubmit = (data: FieldValues) => {
    onApplyFilters(data as T);
    onOpenChange(false);
  };

  const handleClearFilters = () => {
    reset(config.defaultValues);
    onApplyFilters(config.defaultValues);
    onOpenChange(false);
  };

  const renderField = (field: FilterFieldType, register: UseFormRegister<FieldValues>) => {
    switch (field.type) {
      case "text":
        return (
          <Input
            key={field.id}
            text={field.label}
            id={field.id}
            type="text"
            placeholder={field.placeholder || `Filtrar por ${field.label.toLowerCase()}...`}
            register={register as any}
          />
        );
      
      case "select":
      case "asyncSelect":
        return (
          <div key={field.id}>
            <label htmlFor={field.id} className="block text-sm font-medium mb-1">
              {field.label}
            </label>
            <select
              id={field.id}
              {...register(field.id as any)}
              disabled={field.type === "asyncSelect" && field.isLoading}
              className="w-full p-2 rounded-lg border-2 border-[#CABAAE] bg-[#E5DAD1] text-[#3F2323] text-sm hover:border-[#4C2D2D] focus:outline-none focus:ring-2 focus:ring-[#744625] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {field.options.map((option) => (
                <option key={option.value} value={option.value} disabled={(option as any).disabled}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{config.title}</DialogTitle>
          <DialogDescription>
            {config.description}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {config.fields.map((field) => renderField(field, register))}
          <DialogFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={handleClearFilters}>
              Limpar Filtros
            </Button>
            <Button type="submit">Aplicar Filtros</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

