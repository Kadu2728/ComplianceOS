import { redirect } from "next/navigation";
import { SessionRefresher } from "@/components/shell/session-refresher";
import { Sidebar } from "@/components/shell/sidebar";
import { TopBar } from "@/components/shell/top-bar";
import { getSession } from "@/lib/session/server";

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();
  if (!session) redirect("/entrar");
  const organizations = session.memberships.map((m) => ({ id: m.organization.id, name: m.organization.name }));
  const currentId = session.membership.organization.id;
  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-surface-elevated focus:px-3 focus:py-2"
      >
        Ir para o conteúdo
      </a>
      <TopBar currentId={currentId} organizations={organizations} />
      <SessionRefresher />
      <Sidebar currentId={currentId} organizations={organizations} userName={session.user.name} />
      <main id="conteudo" className="mx-auto w-full max-w-[1200px] flex-1 p-4 md:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
