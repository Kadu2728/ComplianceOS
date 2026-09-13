/**
 * Browser-side helper for the /api/v1 proxy. Same-origin, cookies included automatically.
 * Returns the parsed error envelope on failure so forms can show `message` (pt-BR mapping below).
 */

export type ApiError = { code: string; message: string; request_id?: string; details?: unknown };

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError; status: number };

const MESSAGES: Record<string, string> = {
  unauthenticated: "E-mail ou senha incorretos.",
  conflict: "Este e-mail já está cadastrado.",
  rate_limited: "Muitas tentativas. Aguarde um minuto e tente novamente.",
  validation_error: "Verifique os campos destacados.",
  forbidden: "Você não tem permissão para esta ação.",
  forbidden_origin: "Requisição bloqueada por segurança. Recarregue a página.",
  bad_request: "Link inválido ou expirado.",
  internal_error: "Não foi possível concluir. Tente novamente em instantes.",
};

export function humanMessage(error: ApiError): string {
  return MESSAGES[error.code] ?? "Não foi possível concluir. Tente novamente.";
}

export async function api<T>(
  path: string,
  init: { method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; body?: unknown } = {},
): Promise<ApiResult<T>> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: init.method ?? "GET",
      headers: init.body !== undefined ? { "content-type": "application/json" } : undefined,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      credentials: "same-origin",
    });
  } catch {
    return {
      ok: false,
      status: 0,
      error: { code: "network", message: "Sem conexão. Verifique sua rede e tente novamente." },
    };
  }
  const data = (await res.json().catch(() => null)) as T | ApiError | null;
  if (res.ok) return { ok: true, data: data as T };
  const error = (data as ApiError | null) ?? { code: "internal_error", message: "" };
  return { ok: false, status: res.status, error };
}
