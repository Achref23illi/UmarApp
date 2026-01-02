/**
 * Error Handling Utilities
 * ==========================
 * Centralized error handling for the app
 */

import { ApiError } from '@/api/types';
import { AxiosError } from 'axios';

// Error types
export class AppError extends Error {
  public code: string;
  public statusCode?: number;
  public details?: Record<string, string[]>;

  constructor(
    message: string,
    code: string = 'APP_ERROR',
    statusCode?: number,
    details?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Network error. Please check your connection.') {
    super(message, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed. Please log in again.') {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, string[]>) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

/**
 * Parse error from API response
 */
export function parseApiError(error: unknown): AppError {
  // Handle Axios errors
  if (error instanceof AxiosError) {
    const response = error.response;

    // No response - network error
    if (!response) {
      return new NetworkError();
    }

    const data = response.data as ApiError | undefined;
    const message = data?.message || getDefaultErrorMessage(response.status);
    const code = data?.code || `HTTP_${response.status}`;

    // Handle specific status codes
    switch (response.status) {
      case 401:
        return new AuthenticationError(message);
      case 400:
      case 422:
        return new ValidationError(message, data?.errors);
      case 403:
        return new AppError('Access denied', 'FORBIDDEN', 403);
      case 404:
        return new AppError('Resource not found', 'NOT_FOUND', 404);
      case 429:
        return new AppError('Too many requests. Please try again later.', 'RATE_LIMITED', 429);
      case 500:
      case 502:
      case 503:
        return new AppError(
          'Server error. Please try again later.',
          'SERVER_ERROR',
          response.status
        );
      default:
        return new AppError(message, code, response.status);
    }
  }

  // Handle AppError instances
  if (error instanceof AppError) {
    return error;
  }

  // Handle standard Error instances
  if (error instanceof Error) {
    return new AppError(error.message);
  }

  // Handle unknown errors
  return new AppError('An unexpected error occurred');
}

/**
 * Get default error message for status code
 */
function getDefaultErrorMessage(statusCode: number): string {
  const messages: Record<number, string> = {
    400: 'Bad request',
    401: 'Unauthorized',
    403: 'Access denied',
    404: 'Not found',
    422: 'Validation failed',
    429: 'Too many requests',
    500: 'Server error',
    502: 'Bad gateway',
    503: 'Service unavailable',
  };

  return messages[statusCode] || 'An error occurred';
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  const appError = parseApiError(error);
  return appError.message;
}

/**
 * Check if error is of a specific type
 */
export function isNetworkError(error: unknown): boolean {
  return error instanceof NetworkError || (error instanceof AxiosError && !error.response);
}

export function isAuthError(error: unknown): boolean {
  return (
    error instanceof AuthenticationError ||
    (error instanceof AxiosError && error.response?.status === 401)
  );
}

export function isValidationError(error: unknown): boolean {
  return error instanceof ValidationError;
}

/**
 * Log error for debugging/monitoring
 */
export function logError(error: unknown, context?: string): void {
  const appError = parseApiError(error);

  if (__DEV__) {
    console.error(`[${context || 'Error'}]`, {
      name: appError.name,
      code: appError.code,
      message: appError.message,
      statusCode: appError.statusCode,
      details: appError.details,
    });
  }

  // TODO: Send to error monitoring service (Sentry, etc.) in production
  // if (!__DEV__) {
  //   Sentry.captureException(appError, { extra: { context } });
  // }
}
