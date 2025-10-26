import { Navigate } from "react-router-dom";
import { getCookie } from "src/lib/utils";

interface Props {
  children: React.ReactNode;
}

export default function LoggedOutRoute({ children }: Props) {
  const token = getCookie("accessToken");

  if (token) {
    return <Navigate to="/main" replace />;
  }

  return <>{children}</>;
}
