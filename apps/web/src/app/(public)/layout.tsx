import { Wordmark } from "@/components/shell/wordmark";

/** Visitor frame (Compliance Room, D36): no session, no navigation, wordmark and a quiet footer. */
export default function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border bg-surface-elevated">
        <div className="mx-auto flex h-14 max-w-[960px] items-center px-4 md:px-6">
          <Wordmark />
        </div>
      </header>
      <main className="mx-auto w-full max-w-[960px] flex-1 px-4 py-8 md:px-6 md:py-10">{children}</main>
    </div>
  );
}
