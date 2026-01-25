/**
 * Represents a resource that needs to be cleaned up.
 */
export interface IDisposable {
  dispose(): void | Promise<void>;
}

/**
 * Standard retry policy configuration.
 */
export interface IRetryPolicy {
  maxRetries: number;
  backoffMs: number;
}
