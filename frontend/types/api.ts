/**
 * API Type Definitions
 * Centralized type definitions for all API responses to ensure type safety throughout the application.
 */

import { User } from '@/stores/auth-store';

// Generic API Response wrapper
export interface ApiResponse<T> {
    data: T;
    message?: string;
    success?: boolean;
}

// Authentication API responses
export interface LoginResponse {
    token: string;
    refresh_token: string;
}

export interface RefreshTokenResponse {
    token: string;
    refresh_token?: string;
}

export interface UserResponse {
    user: User;
}

// Calendar API responses
export interface CalendarEvent {
    id: string;
    title: string;
    start: string;
    end: string;
    allDay?: boolean;
    backgroundColor?: string;
    borderColor?: string;
    textColor?: string;
}

export type CalendarEventsResponse = CalendarEvent[];

// Error response structure
export interface ApiErrorResponse {
    message: string;
    errors?: Record<string, string | string[]>;
    statusCode?: number;
}
