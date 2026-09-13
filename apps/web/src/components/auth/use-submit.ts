"use client";

import { useState } from "react";
import { type ApiError, api, humanMessage } from "@/lib/api/client";

type FieldErrors = Record<string, string>;

/** Shared submit state for auth forms: pending flag, top-level message, per-field 422 errors. */
export function useSubmit<T>() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<FieldErrors>({});

  async function submit(
    path: string,
    body: unknown,
    onSuccess: (data: T) => void | Promise<void>,
    method: "POST" | "PATCH" | "PUT" = "POST",
  ): Promise<void> {
    setPending(true);
    setError(null);
    setFields({});
    const result = await api<T>(path, { method, body });
    if (result.ok) {
      await onSuccess(result.data);
      return;
    }
    setPending(false);
    setError(humanMessage(result.error));
    setFields(fieldErrors(result.error));
  }

  return { pending, error, fields, submit };
}

function fieldErrors(error: ApiError): FieldErrors {
  if (error.code !== "validation_error" || !Array.isArray(error.details)) return {};
  const out: FieldErrors = {};
  for (const d of error.details as { loc?: unknown[]; msg?: string }[]) {
    const name = d.loc?.[d.loc.length - 1];
    if (typeof name === "string" && d.msg) out[name] = translate(d.msg);
  }
  return out;
}

function translate(msg: string): string {
  if (msg.includes("at least 10")) return "Use pelo menos 10 caracteres.";
  if (msg.includes("at least 2")) return "Informe pelo menos 2 caracteres.";
  if (msg.toLowerCase().includes("email")) return "Informe um e-mail válido.";
  return "Valor inválido.";
}
