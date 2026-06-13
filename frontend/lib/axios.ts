import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/stores/auth-store";
import { env } from "./env";

/**
 * Custom Axios Request Config with retry flag
 */
interface RetryConfig extends InternalAxiosRequestConfig {
    _retry?: boolean;
}

/**
 * Axios Instance
 * Configured with base URL from environment variables and credentials support
 */
export const api = axios.create({
    baseURL: env.apiUrl,
    withCredentials: true, // Send refresh cookies automatically
    timeout: 30000, // 30 second timeout for production
});

/**
 * Request Interceptor
 * Automatically attaches the access token to all requests
 */
api.interceptors.request.use((config) => {
    // Using .getState() to access Zustand state outside React components
    // This is the correct approach for non-component contexts
    const token = useAuthStore.getState().accessToken;

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

/**
 * Token Refresh Logic
 * Handles concurrent requests during token refresh to prevent race conditions
 */
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null): void => {
    failedQueue.forEach((promise) => {
        if (error) {
            promise.reject(error);
        } else if (token) {
            promise.resolve(token);
        }
    });
    failedQueue = [];
};

/**
 * Response Interceptor
 * Handles 401 errors by attempting to refresh the access token
 */
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as RetryConfig;

        // Handle 401 Unauthorized errors
        // Skip for login endpoint to allow form to handle invalid credentials
        if (
            error.response?.status === 401 &&
            originalRequest &&
            !originalRequest._retry &&
            !originalRequest.url?.includes('/login')
        ) {
            originalRequest._retry = true;

            const { setToken, logout } = useAuthStore.getState();

            // If already refreshing, queue this request
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        if (originalRequest.headers) {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                        }
                        return api(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            isRefreshing = true;

            try {
                // Attempt to refresh the token
                const response = await fetch("/api/auth/refresh", {
                    method: "POST",
                    credentials: "include",
                });

                if (!response.ok) {
                    processQueue(error, null);
                    await logout();
                    return Promise.reject(error);
                }

                const data = await response.json();
                const newToken = data.token;

                // Update token in store
                setToken(newToken);
                processQueue(null, newToken);

                // Retry original request with new token
                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                }
                return api(originalRequest);
            } catch (err) {
                processQueue(err, null);
                await logout();
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);
