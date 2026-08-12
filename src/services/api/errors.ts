/** Standard service response — mirrors Supabase PostgREST shape */
export interface ServiceResponse<T> {
  data: T | null;
  error: Error | null;
  count?: number | null;
}

/** @deprecated Use ServiceResponse — kept for backward compatibility during migration */
export type SupabaseResponse<T> = ServiceResponse<T>;

export class ServiceError extends Error {
  readonly code: string | undefined;
  readonly isUserFacing: boolean;

  constructor(message: string, options?: { code?: string; isUserFacing?: boolean; cause?: unknown }) {
    super(message, { cause: options?.cause });
    this.name = 'ServiceError';
    this.code = options?.code;
    this.isUserFacing = options?.isUserFacing ?? true;
  }
}

export function toServiceError(error: unknown, fallbackMessage = 'No se pudo completar la operación'): ServiceError {
  if (error instanceof ServiceError) return error;

  if (error && typeof error === 'object' && 'message' in error) {
    const pgError = error as { message?: string; code?: string; details?: string };
    // Never expose raw PostgreSQL details to end users
    return new ServiceError(fallbackMessage, {
      code: pgError.code,
      cause: pgError,
    });
  }

  return new ServiceError(fallbackMessage, { cause: error });
}

export function ok<T>(data: T, count?: number): ServiceResponse<T> {
  return { data, error: null, count: count ?? null };
}

export function fail<T>(error: unknown, fallbackMessage?: string): ServiceResponse<T> {
  return { data: null, error: toServiceError(error, fallbackMessage) };
}

export async function mockApiCall<T>(data: T, delayMs = 150): Promise<ServiceResponse<T>> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(ok(data)), delayMs);
  });
}
