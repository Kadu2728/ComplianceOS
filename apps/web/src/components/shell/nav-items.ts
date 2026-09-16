import type { LucideIcon } from "lucide-react";
import {
  ClipboardList,
  FileText,
  History,
  LayoutDashboard,
  Layers,
  ListChecks,
  Settings,
  TriangleAlert,
} from "lucide-react";

/** MVP navigation — order and labels per docs/design/app-shell.md §1 (brand §55). */
export type NavItem = { label: string; href: string; icon: LucideIcon };

export const NAV_ITEMS: readonly NavItem[] = [
  { label: "Visão geral", href: "/", icon: LayoutDashboard },
  { label: "Diagnóstico", href: "/diagnostico", icon: ClipboardList },
  { label: "Riscos", href: "/riscos", icon: TriangleAlert },
  { label: "Controles", href: "/controles", icon: Layers },
  { label: "Ações", href: "/acoes", icon: ListChecks },
  { label: "Documentos", href: "/documentos", icon: FileText },
  { label: "Histórico", href: "/historico", icon: History },
  { label: "Configurações", href: "/configuracoes", icon: Settings },
];

export const ICON_STROKE = 1.5;
