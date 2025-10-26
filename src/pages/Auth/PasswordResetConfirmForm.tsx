  // src/components/passwordResetConfirmForm/PasswordResetConfirmForm.tsx

  import { useForm } from "react-hook-form";
  import { zodResolver } from "@hookform/resolvers/zod";
  import { ResetConfirmData, resetConfirmSchema } from "@schemas/LoginSchema";
  import { toast } from "react-toastify";
  import { useState } from "react";
  import { Button } from "@components/Button";
  import Loader from "@components/Loader";
  import Input from "@components/Input";
  import api from "src/api/axios";

  export default function PasswordResetConfirm() {
    const token = window.location.href.split("token=")[1];

    const {
      register,
      handleSubmit,
      formState: { errors, isSubmitting },
    } = useForm<ResetConfirmData>({
      resolver: zodResolver(resetConfirmSchema),
    });

    const [confirmPassword, setConfirmPassword]= useState("");

    async function handleConfirmReset(data: ResetConfirmData) {
      if (confirmPassword !== data.newPassword) {
        toast.error("As senhas não coincidem!");
        return;
      }
      if (!token) {
        toast.error("Token inválido ou ausente.");
        return;
      }
      try {
        const res = await api.post("/auth/password/reset/confirm", {
          token, 
          newPassword: data.newPassword,
        }
        );

        if (res.status === 200) {
          toast.success("Sua senha foi alterada com sucesso!")
          window.location.href = "/login";
        } else {
          toast.error("Não foi possível redefinir a senha.");
        }
      } catch {
        toast.error("Erro inesperado.");
      }
    }

    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <form
          onSubmit={handleSubmit(handleConfirmReset)}
          className="flex flex-col items-center max-w-[700px] w-full p-5 -translate-y-20"
        >
          <img src="/logo.png" alt="Logo" className="h-30 mb-3 mt-5" />

          <h1 className="text-7xl max-[480px]:text-4xl font-bold font-lexend tracking-tight mb-3 w-full">
          Redefina sua <span className="text-[#4C2D2D]">senha</span>
        </h1>
      <div className="w-[500px]">
          <Input
            text="Nova Senha"
            type="password"
            id="newPassword"
            placeholder="Digite a nova senha..."
            register={register}
            error={errors.newPassword?.message}
          />

          <Input
            text="Confirmar Senha"
            type="password"
            id="passwordConfirm"
            placeholder="Confirme a senha do usuário..."
            value = {confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value)
            }}
            />
        </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-12 bg-[#4C2D2D] text-base text-[#EFEAE6] hover:bg-[#3F2323] w-full sm:w-60 mt-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <Loader /> : "Redefinir Senha"}
          </Button>
        </form>
      </div>
    );
  }
