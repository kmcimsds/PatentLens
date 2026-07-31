export type ApiErrorCode =
  | "INVALID_PATENT_NUMBER"
  | "PATENT_NOT_FOUND"
  | "RATE_LIMITED"
  | "UPSTREAM_TIMEOUT"
  | "CONFIGURATION_ERROR"
  | "ANALYSIS_FAILED";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ApiErrorCode,
    message: string,
    public readonly retryable = false
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function isAbortError(error: unknown) {
  return (
    error instanceof Error &&
    (error.name === "AbortError" || error.message.toLowerCase().includes("timeout"))
  );
}
