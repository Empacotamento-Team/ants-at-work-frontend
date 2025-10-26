import Header from "@components/Header";

export default function About() {
  const equipe = [
    "Matheus Carreira Leitão Mendonça Ribeiro",
    "Pedro Henrique Ferreira Anuda",
    "Marcos Vinicios Botelho dos Santos Nunes",
    "Jorge Henry de Andrade Moreira",
    "Evelyn Aline Motta de Paula",
    "João Pedro Araújo das Chagas",
  ];

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#EFEAE6]">
      <Header />

      <div className="flex flex-col items-center justify-start flex-1 px-5 text-center mt-10">
        <h1 className="text-5xl max-[480px]:text-3xl font-bold font-lexend tracking-tight text-[#4C2D2D] mb-8">
          Sobre nós
        </h1>

        <div className="max-w-[800px] text-[#3F2323] text-lg space-y-6 mb-16 leading-relaxed text-justify">
          <p>
            O <strong>Ants At Work</strong> surgiu como uma proposta pelo
            professor <strong>Francisco Henrique de Freitas Viana</strong> de
            criar um sistema capaz de revolucionar a forma como cargas são
            organizadas e transportadas, fornecendo um sistema flexível para lidar
            com diversos tipos de veículos ao mesmo tempo que permite uma
            visualização completa do empacotamento tridimensional de cargas em
            seus interiores.
          </p>

          <p>
            Com a contribuição da equipe{" "} de
            <strong> Anderson Leite Ventura</strong>, foi desenvolvido um
            otimizador inteligente capaz de maximizar a capacidade de carga dos
            caminhões, reduzindo desperdícios de espaço e aumentando a eficiência
            das operações.
          </p>

          <p>
            Nosso sistema foi pensado para ser simples, mas poderoso. Os{" "}
            <strong>gestores</strong> têm liberdade para cadastrar e gerenciar
            toda a operação, enquanto os <strong>peões</strong> cuidam do dia a
            dia e garantem que tudo funcione de forma organizada.
          </p>

          <p>
            Também é possível cadastrar <strong>frotas e caminhões</strong>,
            visualizar cargas distribuídas entre veículos diferentes e acompanhar
            tudo em uma <strong>tela de resumos</strong> clara e objetiva.
          </p>

          <p>
            O <strong>Ants At Work</strong> é mais do que um software: é o
            resultado de colaboração, inovação e vontade de melhorar a logística
            de forma prática e acessível.
          </p>
        </div>

        <h2 className="text-4xl max-[480px]:text-2xl font-semibold font-lexend text-[#4C2D2D] mb-8">
          Nossa Equipe
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-[900px] w-full px-4 mb-16">
          {equipe.map((nome, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-md p-6 flex items-center justify-center text-center text-[#3F2323] font-medium hover:shadow-xl transition-shadow duration-300"
            >
              {nome}
            </div>
          ))}
        </div>
      </div>

      <footer className="mt-10 text-sm text-[#3F2323] opacity-75 mb-5">
        &copy; {new Date().getFullYear()} Ants At Work. Todos os direitos reservados.
      </footer>
    </div>
  );
}
