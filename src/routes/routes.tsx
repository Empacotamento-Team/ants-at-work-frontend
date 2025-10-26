import { createBrowserRouter } from "react-router";
import Home from "../pages/Home";
import Login from "../pages/Auth/Login";
import Main from "../pages/Main";
import ProtectedRoute from "./protectedRoutes";
import Register from "../pages/Auth/RegisterForm";
import PasswordResetRequest from "../pages/Auth/PasswordResetRequestForm";
import PasswordResetConfirm from "../pages/Auth/PasswordResetConfirmForm";
import FirstAccessPasswordChange from "../pages/Auth/FirstAcessChangeForm";
import ManagerRoute from "./managerRoutes";
import TruckList from "../pages/Logistics/TruckList";
import LoggedOutRoute from "./loggedOutRoute";
import MainLayout from "@/layouts/MainLayout";
import FleetList from "@/pages/Logistics/FleetList";
import FleetView from "@/pages/Logistics/FleetView";
import About from "@/pages/About";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/about",
    element: <About />,
  },
  {
    element: <MainLayout />,
    children: [
      {
        path: "/main",
        element: (
          <ProtectedRoute>
            <Main />
          </ProtectedRoute>
        ),
      },
      {
        path: "/trucks",
        element: (
          <ProtectedRoute>
            <TruckList />
          </ProtectedRoute>
        ),
      },
      {
        path: "/fleets",
        element: (
          <ProtectedRoute>
            <FleetList />
          </ProtectedRoute>
        )
      },
      {
        path: "/fleets/:fleetId",
        element: (
          <ProtectedRoute>
            <FleetView />
          </ProtectedRoute>
        )
      }
    ]
  },
  {
    path: "/login",
    element: (
      <LoggedOutRoute>
        <Login />
      </LoggedOutRoute>
    ),
  },
  {
    path: "/register",
    element: (
      <ManagerRoute>
        <Register />
      </ManagerRoute>
    ),
  },
  {
    path: "/reset-request",
    element: (
      <LoggedOutRoute>
        <PasswordResetRequest />,
      </LoggedOutRoute>
    ),
  },
  {
    path: "/reset-password",
    element: (
      <LoggedOutRoute>
        <PasswordResetConfirm />,
      </LoggedOutRoute>
    ),
  },
  {
    path: "/first-access-change",
    element: <FirstAccessPasswordChange />,
  },
]);
