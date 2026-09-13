import { redirect } from "next/navigation";
import { Wordmark } from "@/components/shell/wordmark";
import { getSession } from "@/lib/session/server";

/** Unauthenticated frame: centered card, wordmark, no navigation. Logged-in users go to the app. */
export default async function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  if (await getSession()) redirect("/");
  return (
    <div className="flex min-h-dvh flex-col items-center px-4 py-10 md:justify-center">
      <div className="mb-6">
        <Wordmark />
      </div>
      <main className="w-full max-w-[420px] rounded-lg border border-border bg-surface-elevated p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}
