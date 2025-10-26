import { Link } from "react-router";

type LinkProps = {
  text: string;
  link: string;
  destiny: string;
  className?: string;
};

export default function LinkText({ text, link, destiny, className = "" }: LinkProps) {
  return (
    <p className={`text-gray-500 font-medium w-full flex items-start justify-start gap-1 h-full  ${className}`}>
      <span>{text}</span>
      <Link
        to={`/${destiny}`}
        className="text-[#4C2D2D] font-bold hover:underline transition-colors duration-200"
      >
        {link}
      </Link>
    </p>
  );
}
