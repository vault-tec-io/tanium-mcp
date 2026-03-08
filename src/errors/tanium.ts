export class TaniumAuthError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'TaniumAuthError';
  }
}

export class TaniumApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly taniumCode?: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'TaniumApiError';
  }
}

export class TaniumGraphQLError extends Error {
  constructor(
    message: string,
    public readonly errors: Array<{ message: string; extensions?: Record<string, unknown> }>
  ) {
    super(message);
    this.name = 'TaniumGraphQLError';
  }
}

export class TaniumGraphQLPartialError extends Error {
  constructor(
    message: string,
    public readonly warnings: Array<{ message: string }>
  ) {
    super(message);
    this.name = 'TaniumGraphQLPartialError';
  }
}

export class TaniumRateLimitError extends Error {
  constructor(
    message: string,
    public readonly retryAfterSeconds?: number
  ) {
    super(message);
    this.name = 'TaniumRateLimitError';
  }
}

export class TaniumTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TaniumTimeoutError';
  }
}

export class CacheUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CacheUnavailableError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
