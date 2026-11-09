import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001/api",
});

let authRedirectInProgress = false;

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const requestUrl = String(config.url || "");
  const isAuthRequest = requestUrl.includes("/auth/login") || requestUrl.includes("/auth/2fa/");

  if (token && !isAuthRequest) {
    config.headers.Authorization = "Bearer " + token;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = String(error.config?.url || "");
    const isAuthRequest = requestUrl.includes("/auth/login") || requestUrl.includes("/auth/2fa/");
    const isSessionError = error.response?.data?.code === "SESSION_EXPIRED"
      || error.response?.data?.message === "Sesi sudah tidak aktif"
      || error.response?.data?.message === "Token tidak valid atau sudah expired"
      || error.response?.data?.message === "Token tidak ditemukan";

    if (error.response?.status === 401 && !isAuthRequest && isSessionError && !authRedirectInProgress) {
      authRedirectInProgress = true;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.setItem(
        "authMessage",
        error.response?.data?.code === "SESSION_EXPIRED"
          ? "Sesi Anda berakhir karena tidak ada aktivitas."
          : "Sesi login tidak lagi aktif. Silakan login kembali.",
      );
      if (window.location.pathname !== "/") {
        window.location.assign("/");
      }
    }
    return Promise.reject(error);
  },
);

export default api;
