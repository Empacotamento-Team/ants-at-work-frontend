import { Link } from "react-router-dom";
import { Button } from "@components/button";

export default function Header() {
  return (
    <header className="flex justify-between items-center w-full px-8 py-4 bg-[#E5DAD1] shadow-md">
      <Link to="/">
        <img src="/logo.png" alt="Logo" className="h-12 w-auto object-contain" />
      </Link>

      <nav className="flex items-center gap-4">
        <Link to="/about">
          <Button className="px-4 py-2 rounded-2xl bg-[#FFFFFF] hover:bg-[#E5DAD1] text-[#4C2D2D] border-2 border-[#4C2D2D] font-semibold transition">
            Sobre nós
          </Button>
        </Link>
        
        <Link to="/">
          <Button className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#4C2D2D] hover:bg-[#3F2323] text-white font-semibold transition">
            <i className="fa-solid fa-house text-sm"></i>
            Início
          </Button>
        </Link>

        <Link to="/login">
          <Button className="px-4 py-2 rounded-2xl bg-[#FFFFFF] hover:bg-[#E5DAD1] text-[#4C2D2D] border-2 border-[#4C2D2D] font-semibold transition">
            Login
          </Button>
        </Link>
      </nav>
    </header>
  );
}
