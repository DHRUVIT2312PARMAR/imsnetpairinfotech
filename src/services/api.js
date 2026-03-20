import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1",
  timeout: 10000,
  withCredentials: true, // send httpOnly cookie on every request
});

// Track if a refresh is already in-flight to avoid multiple simultaneous refresh calls
let isRefreshing = false;
// Queue of requests that failed with 401 while refresh was in-flight
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve();
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

    // Only attempt refresh on 401, and not on the refresh/login/logout routes themselves
    const isAuthRoute = original?.url?.includes("/auth/");
    if (err.response?.status === 401 && !original._retry && !isAuthRoute) {
      if (isRefreshing) {
        // Another refresh is already running — queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(original))
          .catch((e) => Promise.reject(e));
      }

      original._retry = true;
      isRefreshing = true;

      try {
        // Refresh token is in httpOnly cookie — just call the endpoint
        await api.post("/auth/refresh");
        processQueue(null);
        return api(original); // retry original request with new access token cookie
      } catch (refreshErr) {
        // Refresh failed — session is dead, send to login
        processQueue(refreshErr);
        localStorage.removeItem("user");
        window.location.href = "/";
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err);
  }
);

export default api;
