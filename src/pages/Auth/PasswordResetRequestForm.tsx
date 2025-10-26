import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { ResetRequestData, resetRequestSchema } from "@schemas/LoginSchema";
import { Link } from "react-router";
import { toast } from "react-toastify";
import { Button } from "@components/Button";
import Input from "@components/Input";
import Loader from "@components/Loader";
import api from "src/api/axios";

export default function PasswordResetRequest() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetRequestData>({
    resolver: zodResolver(resetRequestSchema),
  });

  const [successMessage, setSuccessMessage] = useState("");

  async function handleRequestReset(data: ResetRequestData) {
    try {
      const res = await api.post("/auth/password/reset/request", data);
       if (res.status === 200) {
        toast.success("Solicitação de redefinição realizada com sucesso!");
        window.location.href = "/login"; 
      } else {
        toast.error("Erro no envio da solicitação de redefinição.")
      }
    } catch {
      toast.error("Erro inesperado.");
      setSuccessMessage("");
    }
  }

  return (
    <div className="min-h-screen flex-row flex justify-center items-center bg-gray-50">
      <form
        onSubmit={handleSubmit(handleRequestReset)}
        className="flex flex-col items-center max-w-[780px] w-full p-5 -translate-y-20"
      >
        <img src="/logo.png" alt="Logo" className="h-30 mb-3 mt-5" />

        <h1 className="text-7xl max-[480px]:text-4xl font-bold font-lexend tracking-tight mb-3 w-full">
        Redefinição <span className="text-[#4C2D2D]">por email</span>
      </h1>
      <div className="w-[600px]">
        <Input
          text="Email"
          type="email"
          id="email"
          placeholder="Insira seu email..."
          register={register}
          error={errors.email?.message}
        />
        </div>

        {/* {errorMessage && (
          <p className="text-[#800000] text-xs mt-1 ml-1 font-medium">{errorMessage}</p>
        )} */}
        {successMessage && (
          <p className="text-[#4C2D2D] text-xs mt-1 ml-1 font-medium">{successMessage}</p>
        )}
        <div className="flex flex-col sm:flex-row justify-center items-center w-full mt-3 gap-4">
          <Link to="/main" className="w-full sm:w-auto">
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
            {isSubmitting ? <Loader /> : "Enviar"}
          </Button>
        </div>
      </form>
    </div>
  );
}
