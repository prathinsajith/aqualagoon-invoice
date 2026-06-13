/**
 * Application-level error with an HTTP status code and a stable machine-readable
 * `code`. Thrown from services/repositories and translated into the centralized
 * response envelope by the global error handler in `app.ts`.
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const BadRequest = (message: string, details?: unknown) =>
  new AppError(400, "BAD_REQUEST", message, details);

export const Unauthorized = (message = "Authentication required") =>
  new AppError(401, "UNAUTHORIZED", message);

export const Forbidden = (message = "You do not have permission to do that") =>
  new AppError(403, "FORBIDDEN", message);

export const NotFound = (message = "Resource not found") =>
  new AppError(404, "NOT_FOUND", message);

export const Conflict = (message: string, details?: unknown) =>
  new AppError(409, "CONFLICT", message, details);

export const isAppError = (error: unknown): error is AppError =>
  error instanceof AppError;
