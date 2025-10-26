import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import api from "src/api/axios";
import { RegisterData, registerSchema } from "@schemas/LoginSchema";
import Input from "@components/Input";
import { Button } from "@components/Button";
import { useState, useEffect } from "react";
import Loader from "@components/Loader";
import Select from "@components/Select";
import { toast } from "react-toastify";
import { Link } from "react-router";

export default function RegisterForm() {
  const {
    register: hookFormRegister,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue
  } = useForm<RegisterData>({ resolver: zodResolver(registerSchema) });

  const [roles, setRoles] = useState<{ name: string, canRegister: boolean }[]>([]);
  const [selectedRole, setSelectedRole] = useState("");

  useEffect(() => {
    async function fetchRoles() {
      try {
        const res = await api.get("/users/roles");
        setRoles(res.data);
      } catch {
        toast.error("Erro ao carregar os papéis de usuário.");
      }
    }
    fetchRoles();
  }, []);

  useEffect(() => {
    setValue("role", selectedRole); 
  }, [selectedRole, setValue]);

  async function handleRegister(data: RegisterData) {
    try {
      const res = await api.post("/auth/register", data);
      if (res.status === 201) {
        toast.success("Cadastro realizado com sucesso!");
        window.location.href = "/login"; 
      } else {
        toast.error("Erro ao cadastrar usuário.");
      }
    } catch (err: unknown) {
      toast.error((err as any).response?.data?.message || "Erro inesperado.");
    }
  }

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-50">
      <form
        onSubmit={handleSubmit(handleRegister)}
        className="min-h-screen flex flex-col items-center max-w-[700px] w-full p-5"
      >
        <img src="/logo.png" alt="Logo" className="h-30 mb-3 mt-5" />

        <p className="font-semibold text-start text-gray-500 text-sm sm:text-lg w-full">
          Comece agora!
        </p>

        <h1 className="text-7xl max-[480px]:text-4xl font-bold font-lexend tracking-tight mb-3 w-full">
          Cadastro de <span className="text-[#4C2D2D]">usuários</span>
        </h1>

        <Input
          text="Nome"
          type="text"
          id="name"
          placeholder="Insira o nome do usuário..."
          register={hookFormRegister}
          error={errors.name?.message}
        />

        <Input
          text="Email"
          type="email"
          id="email"
          placeholder="Insira o email do usuário..."
          register={hookFormRegister}
          error={errors.email?.message}
        />

        <Select
          options={roles.map((r) => ({ value: r.name, label: r.name, disabled: !r.canRegister }))}
          placeholder="Papel do usuário"
          value={selectedRole}
          onChange={setSelectedRole}
          error={errors.role?.message}
        />

        <div className="flex flex-col sm:flex-row justify-center items-start w-full mt-5 gap-4">
          <Link to="/main">
            <Button
              disabled={isSubmitting}
              className="h-12 bg-[#4C2D2D] text-base text-[#EFEAE6] hover:bg-[#3F2323] w-full sm:w-60 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <Loader /> : "Voltar"}
            </Button>       
          </Link>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-12 bg-[#4C2D2D] text-base text-[#EFEAE6] hover:bg-[#3F2323] w-full sm:w-60 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <Loader /> : "Cadastrar"}
          </Button>
        </div>
      </form>
    </div>
  );
}
