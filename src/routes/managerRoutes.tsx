import { useEffect, useState } from "react";
import api from "src/api/axios";
import Loader from "@components/Loader";
import { Navigate, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";

interface Props {
  children: React.ReactNode;
}

interface UserResponse {
  roles: string[];
}

async function fetchUser(): Promise<UserResponse> {
  const res = await api.get("/users/me");
  return res.data;
}

export default function ManagerRoute({ children }: Props) {
  const navigate = useNavigate();
  const [isManager, setIsManager] = useState(false);
  const { data, isPending, isError } = useQuery<UserResponse, Error>({
    queryKey: ["user-me"],
    queryFn: fetchUser,
  });

  useEffect(() => {
    if (data) {
      if (!data.roles.includes("Administrador") && !data.roles.includes("Gestor")) {
        navigate("/login");
      }
      setIsManager(true);
    }
  }, [data])

  if (isError) {
    return <Navigate to="/login" replace />;
  }

  if (isPending) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader />
      </div>
    );
  }

  return <>{isManager && children}</>;
}
