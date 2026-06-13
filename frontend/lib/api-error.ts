import { AxiosError } from "axios";

interface BackendError {
    message?: string;
    code?: string;
    issues?: { path: string; message: string }[];
}

/**
 * Extracts a human-friendly message from an error thrown by the `api` client.
 * The backend always responds with `{ message, code, issues? }` on failure.
 */
export function getApiErrorMessage(error: unknown, fallback = "Something went wrong"): string {
    if (error instanceof AxiosError) {
        const data = error.response?.data as BackendError | undefined;
        if (data?.issues?.length) return data.issues.map((i) => i.message).join(", ");
        if (data?.message) return data.message;
        if (error.code === "ECONNABORTED") return "The request timed out. Please try again.";
        if (!error.response) return "Network error. Please check your connection.";
    }
    if (error instanceof Error && error.message) return error.message;
    return fallback;
}
