import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = "Bearer " + token;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !String(error.config?.url || "").includes("/auth/login")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.setItem(
        "authMessage",
        error.response?.data?.code === "SESSION_EXPIRED"
          ? "Sesi Anda berakhir karena tidak ada aktivitas."
          : "Sesi login tidak lagi aktif. Silakan login kembali.",
      );
      window.location.assign("/");
    }
    return Promise.reject(error);
  },
);

export default api;
