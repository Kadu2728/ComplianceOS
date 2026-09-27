"use client";

import { useRouter } from "next/navigation";
import { startTransition } from "react";
import { buttonClass } from "@/components/ui/button";

/**
 * Error boundary for the authenticated pages (visual-v2 §4.6, app-shell.md §5 copy pattern):
 * never blame the user, say that nothing was changed, offer a retry. The shell stays on screen.
 */
export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();
  // reset() alone re-renders the same failed server payload; refresh fetches it again.
  const retry = () =>
    startTransition(() => {
      router.refresh();
      reset();
    });
  return (
    <section
      aria-labelledby="erro-pagina"
      className="mx-auto flex max-w-[480px] flex-col items-center gap-4 rounded-lg border border-border bg-surface-elevated px-6 py-16 text-center"
    >
      <h1 id="erro-pagina" className="text-h3">
        Não foi possível carregar esta página.
      </h1>
      <p className="text-body text-text-secondary">Verifique sua conexão e tente novamente. Seus dados não foram alterados.</p>
      <button type="button" onClick={retry} className={buttonClass("primary")}>
        Tentar de novo
      </button>
    </section>
  );
}
