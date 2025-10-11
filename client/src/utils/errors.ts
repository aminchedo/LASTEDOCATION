export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
}

export function toUserMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message || 'خطای غیرمنتظره';
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'خطای غیرمنتظره';
}

export function normalizeError(error: unknown): ApiError {
  if (error instanceof Error) {
    return {
      message: error.message || 'خطای غیرمنتظره',
      details: error,
    };
  }
  
  if (typeof error === 'object' && error !== null) {
    const err = error as any;
    return {
      message: err.message || err.error || 'خطای غیرمنتظره',
      status: err.status || err.statusCode,
      code: err.code,
      details: error,
    };
  }

  return {
    message: 'خطای غیرمنتظره',
    details: error,
  };
}

export class HttpError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message);
    this.name = 'HttpError';
  }
}
