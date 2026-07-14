/**
 * Wrapper around fetch that includes credentials for authenticated requests.
 * This ensures cookies (session tokens) are sent with requests in local dev.
 */

interface AuthFetchOptions extends RequestInit {
  /** Whether to include credentials. Default: true */
  authenticated?: boolean;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export async function authFetch<T>(
  endpoint: string,
  options: AuthFetchOptions = {}
): Promise<T> {
  const { authenticated = true, ...fetchOptions } = options;

  const headers = new Headers(fetchOptions.headers);
  if (!headers.has("Content-Type") && !(fetchOptions.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...fetchOptions,
    headers,
    credentials: authenticated ? "include" : "omit",
  });

  if (response.status === 401) {
    // Clear any stale session data
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }
    throw new AuthError("Session expired. Please log in again.");
  }

  if (!response.ok) {
    const body = await response.text();
    throw new ApiError(response.status, response.statusText, body);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export class ApiError extends Error {
  status: number;
  statusText: string;
  body: string;

  constructor(status: number, statusText: string, body: string) {
    super(`API Error ${status}: ${statusText}`);
    this.name = "ApiError";
    this.status = status;
    this.statusText = statusText;
    this.body = body;
  }
}
