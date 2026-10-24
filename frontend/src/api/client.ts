import createClient from "openapi-fetch";

import type { paths } from "./schema";

// One origin for the SPA and the API: the Vite proxy in development, Caddy in production
// (docs/03-architecture.md). Paths already start with /api/v1.
export const api = createClient<paths>({
  baseUrl: window.location.origin,
  // Look fetch up on every call: openapi-fetch otherwise keeps the one present at import,
  // and requests in tests would go to the network past the MSW interceptor.
  fetch: (request) => globalThis.fetch(request),
});

/** The stable `code` of a problem+json error (docs/06-api.md); the UI translates it via i18n. */
export function problemCode(error: unknown): string | null {
  if (typeof error === "object" && error !== null && "code" in error) {
    return typeof error.code === "string" ? error.code : null;
  }
  return null;
}
