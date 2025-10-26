import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { getCookie, setCookie } from "src/lib/utils";

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:8080",
});

let isRefreshing = false;
let failedList: {
  resolve: (token: string) => void;
  reject: (err: AxiosError) => void;
}[] = [];

const processList = (error: AxiosError | null, token: string | null) => {
  failedList.forEach((res) => {
    if (error) {
      res.reject(error);
    } else {
      res.resolve(token!);
    }
  });
  failedList = [];
};

const resolveError = (error: AxiosError) => {
  processList(error, null);
  setCookie("accessToken", "", -1);
  setCookie("refreshToken", "", -1);
  setCookie("passwordChangeRequired", "", -1);
  delete api.defaults.headers.common["Authorization"];

  if (window.location.pathname !== "/login")
    window.location.href = "/login";
  return Promise.reject(error);
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getCookie("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedList.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers["Authorization"] = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = getCookie("refreshToken");
        if (!refreshToken) {
          return resolveError(error);
        }
        
        setCookie("accessToken", "", -1);
        const res = await api.post("/auth/refresh", { refreshToken });
        const newToken = res.data.accessToken;
        setCookie("accessToken", newToken, 2);

        api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
        processList(null, newToken);

        return api(originalRequest);
      } catch (err: unknown) {
        return resolveError(err as AxiosError);
      } finally {
        isRefreshing = false;
        console.log("stopped")
      }
    }

    return Promise.reject(error);
  }
);

export default api;
