import type { LucideIcon } from "lucide-react";
import {
  ClipboardList,
  DoorOpen,
  FileChartColumn,
  FileText,
  History,
  House,
  Layers,
  ListChecks,
  Settings,
  TriangleAlert,
} from "lucide-react";

/**
 * Navigation v2 (visual-v2 §3.2): pt-BR labels (owner decision 2026-09-26) in two groups —
 * operate, then prove & manage. "Relatórios" is the existing executive summary (`/resumo`).
 */
export type NavItem = { label: string; href: string; icon: LucideIcon; roles?: readonly string[] };

export const NAV_GROUPS: readonly (readonly NavItem[])[] = [
  [
    { label: "Visão geral", href: "/", icon: House },
    { label: "Diagnóstico", href: "/diagnostico", icon: ClipboardList },
    { label: "Riscos", href: "/riscos", icon: TriangleAlert },
    { label: "Controles", href: "/controles", icon: Layers },
    { label: "Ações", href: "/acoes", icon: ListChecks },
    { label: "Documentos", href: "/documentos", icon: FileText },
  ],
  [
    { label: "Sala de compliance", href: "/sala", icon: DoorOpen, roles: ["owner"] },
    { label: "Relatórios", href: "/resumo", icon: FileChartColumn },
    { label: "Histórico", href: "/historico", icon: History },
    { label: "Configurações", href: "/configuracoes", icon: Settings },
  ],
];

/** Groups with only the items the current role may see (an item without `roles` is for everyone). */
export function navGroupsFor(role: string): NavItem[][] {
  return NAV_GROUPS.map((group) => group.filter((item) => !item.roles || item.roles.includes(role))).filter(
    (group) => group.length > 0,
  );
}

export const ICON_STROKE = 1.5;
