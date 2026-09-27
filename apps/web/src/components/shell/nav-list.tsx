import { Fragment } from "react";
import { ICON_STROKE, navGroupsFor } from "./nav-items";
import { NavLink } from "./nav-link";

/** The grouped navigation shared by the sidebar and the drawer (visual-v2 §3.2, §3.6). */
export function NavList({ role, onNavigate, tall = false }: { role: string; onNavigate?: () => void; tall?: boolean }) {
  return (
    <>
      {navGroupsFor(role).map((group, i) => (
        <Fragment key={group[0]!.href}>
          {i > 0 ? <hr aria-hidden className="my-3 border-border" /> : null}
          <ul className="flex flex-col gap-0.5">
            {group.map((item) => (
              <li key={item.href}>
                <NavLink
                  href={item.href}
                  label={item.label}
                  tall={tall}
                  onNavigate={onNavigate}
                  icon={<item.icon aria-hidden size={20} strokeWidth={ICON_STROKE} className="shrink-0" />}
                />
              </li>
            ))}
          </ul>
        </Fragment>
      ))}
    </>
  );
}
