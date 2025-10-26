import { Navigate } from "react-router-dom";
import { getCookie } from "@/lib/utils";

interface Props {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: Props) {
  //const token = localStorage.getItem("accessToken");
  const token = getCookie("accessToken");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
