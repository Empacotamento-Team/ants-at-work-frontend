import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginData, loginSchema } from "@schemas/LoginSchema";
import { toast } from "react-toastify";
import { Button } from "@components/Button";
import LinkText from "@components/LinkText";
import Loader from "@components/Loader";
import FormInput from "@components/FormInput";
import api from "src/api/axios";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { setCookie } from "@/lib/utils";
import { AxiosError } from "axios";

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  passwordChangeRequired: boolean;
}

function saveTokens(loginResponse: LoginResponse) {
  const { accessToken, refreshToken, passwordChangeRequired } = loginResponse;

  setCookie("accessToken", accessToken, 2);
  setCookie("refreshToken", refreshToken, 7);
  setCookie(
    "passwordChangeRequired",
    passwordChangeRequired ? "true" : "false",
    2
  );
}

async function handleLogin(data: LoginData) {
  const res = await api.post("/auth/login", data);
  return res;
}

export default function Login() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginData>({ resolver: zodResolver(loginSchema) });
  const navigate = useNavigate();
  const loginMutation = useMutation({
    mutationFn: handleLogin,
    onSuccess: (response: unknown) => {
      const responseData = (response as { data: LoginResponse })?.data;
      saveTokens(responseData);

      if (responseData?.passwordChangeRequired) {
        toast.info(
          "Você precisa trocar a sua senha de primeiro acesso antes de continuar."
        );

        navigate("/first-access-change");
        return;
      }

      toast.success("Login efetuado com sucesso!");
      navigate("/main");
    },
  });

  const onSubmit = async (data: LoginData) => {
    try {
      await loginMutation.mutateAsync(data);
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        toast.error(err?.response?.data?.message || "Erro inesperado.");
        return;
      }
      toast.error("Erro inesperado.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="min-h-screen flex flex-col items-center m-15 pt-10"
    >
      <img src="/logo.png" alt="Logo" className="h-30 mb-3 mt-5" />

      <h1 className="text-7xl max-[480px]:text-4xl font-bold font-lexend tracking-tight mb-3 w-full">
        Faça seu <span className="text-[#4C2D2D]">login</span>
      </h1>

      <FormInput
        text="Email"
        type="email"
        id="email"
        placeholder="Insira seu email..."
        register={register}
        error={errors.email?.message}
      />

      <FormInput
        text="Senha"
        type="password"
        id="password"
        placeholder="Insira sua senha..."
        register={register}
        error={errors.password?.message}
      />

      <div className="flex flex-col sm:flex-row justify-center items-start w-full mt-5 gap-4">
        <LinkText
          text="Esqueceu a senha?"
          link="Clique aqui!"
          destiny="reset-request"
          className="text-xs"
        />
        <Button
          type="submit"
          disabled={loginMutation.isPending}
          className="h-12 bg-[#4C2D2D] text-base text-[#EFEAE6] hover:bg-[#3F2323] w-full sm:w-60 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loginMutation.isPending ? <Loader /> : "Entrar"}
        </Button>
      </div>
    </form>
  );
}
