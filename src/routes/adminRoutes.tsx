
import api from "@/api/axios";
import Loader from "@components/Loader";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate, Navigate } from "react-router";

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

export default function AdminRoute({ children }: Props) {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const { data, isPending, isError } = useQuery<UserResponse, Error>({
    queryKey: ["user-me"],
    queryFn: fetchUser,
  });

  useEffect(() => {
    const roles = data?.roles;
    if (roles) {
      if (!roles.includes("Administrador")) {
        navigate("/login");
      }
      setIsAdmin(true);
    }
  }, [data]);

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

  return <>{isAdmin && children}</>;
}
