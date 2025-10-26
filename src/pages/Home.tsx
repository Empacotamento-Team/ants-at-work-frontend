import Header from "@components/Header";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center bg-[#EFEAE6]">
      <Header />

      <div className="flex flex-col items-center justify-center flex-1 px-5 text-center">
        <h1 className="text-6xl max-[480px]:text-4xl font-bold font-lexend tracking-tight text-[#4C2D2D] mb-4 mt-10">
          Caminhões também são gente!
        </h1>
        <p className="text-lg max-w-[600px] text-[#3F2323] mb-10">
          Bem-vindo ao nosso sistema de gestão de frota. Faça login para acessar
          todas as funcionalidades.
        </p>
      </div>

      <footer className="mt-10 text-sm text-[#3F2323] opacity-75 mb-5">
        &copy; {new Date().getFullYear()} Seu Sistema. Todos os direitos reservados.
      </footer>
    </div>
  );
}
