import { api } from "@/lib/axios";
import { Status } from "@/app/(root)/status/columns";

/**
 * Response structure for paginated status list
 */
export interface StatusListResponse {
    data: Status[];
    meta?: {
        pagination?: {
            page: number;
            limit: number;
            totalPages: number;
            totalItems: number;
        };
    };
}

/**
 * Request payload for creating a new status
 */
export interface CreateStatusRequest {
    label: string;
    colorCode: string;
}

/**
 * Request payload for updating an existing status
 */
export interface UpdateStatusRequest {
    id?: number;
    label?: string;
    colorCode?: string;
}

/**
 * Service layer for Status CRUD operations
 * Handles all API interactions related to status management
 */
export const StatusService = {
    /**
     * Fetch paginated list of statuses
     * @param page - Page number (1-indexed)
     * @param limit - Number of items per page
     * @returns Promise with status list and pagination metadata
     */
    getAll: async (page = 1, limit = 10): Promise<StatusListResponse> => {
        const response = await api.put("/api/status/get-all-status-list", {
            page,
            limit,
        });


        const result: StatusListResponse = {
            data: response.data?.data || [],
            meta: response.data?.meta,
        };

        return result;
    },

    /**
     * Fetch a single status by ID
     * @param id - Status ID
     * @returns Promise with status details
     */
    getById: async (id: number): Promise<Status> => {
        const response = await api.get(`/api/status/${id}`);
        return response.data;
    },

    /**
     * Create a new status
     * @param data - Status data (label and colorCode)
     * @returns Promise with created status
     */
    create: async (data: CreateStatusRequest): Promise<Status> => {
        const response = await api.post("/api/status", data);
        return response.data;
    },

    /**
     * Update an existing status
     * @param id - Status ID
     * @param data - Partial status data to update
     * @returns Promise with updated status
     */
    update: async (id: number, data: UpdateStatusRequest): Promise<Status> => {
        const response = await api.put(`/api/status/${id}`, data);
        return response.data;
    },

    /**
     * Delete a status
     * @param id - Status ID
     * @returns Promise that resolves when deletion is complete
     */
    delete: async (id: number): Promise<void> => {
        await api.delete(`/api/status/${id}`);
    },
};

