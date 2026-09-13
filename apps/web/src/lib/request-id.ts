/**
 * Request-ID helpers shared by server-side fetches to the API.
 * The API echoes `X-Request-ID`; the web app forwards it so a single id
 * follows a request across both services (see docs/architecture.md).
 */
export const REQUEST_ID_HEADER = "X-Request-ID";

export function isValidRequestId(value: string | null | undefined): value is string {
  return typeof value === "string" && /^[A-Za-z0-9-]{8,128}$/.test(value);
}
