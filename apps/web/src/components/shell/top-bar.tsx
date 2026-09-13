import { MobileDrawer } from "./mobile-drawer";
import { Wordmark } from "./wordmark";

/** Mobile-only top bar (< md). On larger screens the sidebar carries the wordmark. */
export function TopBar() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-surface-elevated pr-2 md:hidden">
      <Wordmark />
      <MobileDrawer />
    </header>
  );
}
