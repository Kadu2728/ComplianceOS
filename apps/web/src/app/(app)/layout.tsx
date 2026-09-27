import { redirect } from "next/navigation";
import { AppHeader } from "@/components/shell/app-header";
import { MobileDrawer } from "@/components/shell/mobile-drawer";
import { SessionRefresher } from "@/components/shell/session-refresher";
import { Sidebar } from "@/components/shell/sidebar";
import { TabBar } from "@/components/shell/tab-bar";
import { apiGetSafe } from "@/lib/api/server";
import type { Radar } from "@/lib/domain/queries";
import { getSession } from "@/lib/session/server";

/**
 * Application shell v2 (visual-v2 §3): sidebar ≥ 1024, one sticky header for every width (search,
 * bell = Risk Radar, user), the drawer below 1024 and the bottom tab bar below 768. The radar is
 * fetched once per request for the bell; a failure only leaves the bell without a count.
 */
export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();
  if (!session) redirect("/entrar");
  const organizations = session.memberships.map((m) => ({ id: m.organization.id, name: m.organization.name }));
  const currentId = session.membership.organization.id;
  const role = session.membership.role;
  const radar = await apiGetSafe<Radar>(`/api/v1/orgs/${currentId}/radar`);
  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-surface-elevated focus:px-3 focus:py-2"
      >
        Ir para o conteúdo
      </a>
      <SessionRefresher />
      <Sidebar currentId={currentId} organizations={organizations} role={role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader orgId={currentId} radar={radar} userName={session.user.name} role={role} />
        <main
          id="conteudo"
          className="mx-auto w-full max-w-[1200px] flex-1 px-4 pt-6 pb-[calc(64px+env(safe-area-inset-bottom)+16px)] sm:px-6 md:pb-8 lg:px-8 lg:pt-8 2xl:max-w-[1504px]"
        >
          {children}
        </main>
      </div>
      <TabBar />
      <MobileDrawer currentId={currentId} organizations={organizations} role={role} userName={session.user.name} />
    </div>
  );
}
