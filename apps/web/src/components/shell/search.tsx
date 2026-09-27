"use client";

import { CircleAlert, FileText, Layers, ListChecks, Search as SearchIcon, TriangleAlert, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { type KeyboardEvent, type ReactNode, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { SeverityDot } from "@/components/ui/badge";
import { ACTION_STATUS, CONTROL_STATUS, DOCUMENT_STATUS, SEVERITY } from "@/lib/domain/labels";
import type { SearchGroup, SearchResult } from "@/lib/domain/queries";
import {
  SEARCH_GROUP_LABEL,
  SEARCH_HREF,
  SEARCH_MAX,
  SEARCH_MIN,
  type SearchKind,
  splitMatch,
  todayInSaoPaulo,
} from "@/lib/domain/search";
import { ICON_STROKE } from "./nav-items";
import { announceOpen, isPhone, useCloseOnOtherOpen } from "./popover-bus";

type Status = "idle" | "loading" | "ok" | "error" | "rate";
type Option = { key: string; kind: SearchKind; href: string; group: SearchGroup; item: SearchGroup["items"][number] };

const KIND_ICON = { risk: TriangleAlert, action: ListChecks, control: Layers, document: FileText } as const;
const PLACEHOLDER = "Buscar riscos, ações, controles e documentos";
const TONE_TEXT = { danger: "text-danger-text", warning: "text-warning-text", info: "text-info-text", success: "text-success-text", neutral: "text-text-secondary" } as const;

function Meta({ group, item }: { group: SearchGroup; item: SearchGroup["items"][number] }) {
  if (group.kind === "risk" && "severity" in item) {
    return (
      <span className="flex items-center gap-1.5 text-text-secondary">
        <SeverityDot severity={item.severity} size={8} />
        {SEVERITY[item.severity]?.label}
      </span>
    );
  }
  if (group.kind === "action" && "due_date" in item) {
    const overdue = item.due_date && item.status !== "concluida" && item.due_date < todayInSaoPaulo();
    return (
      <span className="text-text-secondary">
        {ACTION_STATUS[item.status]?.label ?? item.status}
        {overdue ? <span className="text-danger-text"> · atrasada</span> : null}
      </span>
    );
  }
  if (group.kind === "control") return <span className="text-text-secondary">{CONTROL_STATUS[item.status]?.label ?? item.status}</span>;
  const doc = DOCUMENT_STATUS[item.status];
  return <span className={doc ? TONE_TEXT[doc.tone] : "text-text-secondary"}>{doc?.label ?? item.status}</span>;
}

function Title({ title, query }: { title: string; query: string }) {
  const parts = splitMatch(title, query);
  if (!parts) return <>{title}</>;
  return (
    <>
      {parts[0]}
      <mark className="rounded-[2px] bg-primary-tint font-semibold text-text-primary">{parts[1]}</mark>
      {parts[2]}
    </>
  );
}

/**
 * Header search (visual-v2 §5.10): an ARIA 1.2 combobox over `GET /orgs/{org}/search` — risks,
 * actions, controls and documents by title, grouped, case- and accent-insensitive. Inline field
 * from 768px; below that a button opens the same search in a full-screen dialog. `/` and Ctrl/⌘+K
 * focus it. Debounced 200ms, in-flight requests aborted, nothing cached across organizations.
 */
export function HeaderSearch({ orgId }: { orgId: string }) {
  const router = useRouter();
  const uid = useId();
  const listId = `busca-resultados-${uid}`;
  const inputRef = useRef<HTMLInputElement>(null);
  const sheetInputRef = useRef<HTMLInputElement>(null);
  const sheetRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [slow, setSlow] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [active, setActive] = useState(-1);
  const [attempt, setAttempt] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);

  const query = q.trim();
  const close = useCallback(() => {
    setOpen(false);
    setActive(-1);
  }, []);
  useCloseOnOtherOpen("search", close);

  const groups = useMemo(() => (result?.groups ?? []).filter((g) => g.total > 0), [result]);
  const options = useMemo<Option[]>(
    () =>
      groups.flatMap((group) =>
        group.items.map((item) => ({ key: `${group.kind}-${item.id}`, kind: group.kind, href: SEARCH_HREF[group.kind](item.id), group, item })),
      ),
    [groups],
  );

  // Debounced request; the previous one is aborted so a slow answer never overwrites a newer one.
  useEffect(() => {
    abortRef.current?.abort();
    if (query.length < SEARCH_MIN) {
      setStatus("idle");
      setResult(null);
      return;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    const slowTimer = window.setTimeout(() => setSlow(true), 150);
    const timer = window.setTimeout(async () => {
      setStatus("loading");
      try {
        const res = await fetch(`/api/v1/orgs/${orgId}/search?q=${encodeURIComponent(query)}&limit=5`, {
          credentials: "same-origin",
          signal: controller.signal,
        });
        if (res.status === 401) {
          window.location.assign("/entrar");
          return;
        }
        if (res.status === 429) {
          setStatus("rate");
          return;
        }
        if (!res.ok) throw new Error(String(res.status));
        setResult((await res.json()) as SearchResult);
        setActive(-1);
        setStatus("ok");
      } catch (e) {
        if ((e as Error).name !== "AbortError") setStatus("error");
      } finally {
        window.clearTimeout(slowTimer);
        if (!controller.signal.aborted) setSlow(false);
      }
    }, 200);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(slowTimer);
      setSlow(false);
      controller.abort();
    };
  }, [query, orgId, attempt]);

  const openSheet = useCallback(() => {
    announceOpen("search");
    if (!sheetRef.current?.open) sheetRef.current?.showModal();
    setSheetOpen(true);
    setOpen(true);
    window.setTimeout(() => sheetInputRef.current?.focus(), 0);
  }, []);

  // `/` (outside fields) and Ctrl/⌘+K focus the search from anywhere.
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target?.closest("input, textarea, select, [contenteditable='true']");
      const combo = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k";
      if (!combo && (e.key !== "/" || typing || e.altKey || e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      if (isPhone()) openSheet();
      else inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openSheet]);

  // A click outside the inline field and its popover closes it.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (sheetRef.current?.open) return;
      if (!wrapRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, close]);

  const go = (opt: Option) => {
    close();
    if (sheetRef.current?.open) sheetRef.current.close();
    // Leave and clear the field: the next page starts from the top (the route announcer names it),
    // and a stray "/" or letter no longer lands in an old query.
    inputRef.current?.blur();
    setQ("");
    router.push(opt.href);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        announceOpen("search");
        setOpen(true);
      }
      if (options.length === 0) return;
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((i) => (i < 0 ? (step > 0 ? 0 : options.length - 1) : (i + step + options.length) % options.length));
    } else if (e.key === "Enter") {
      const opt = options[active >= 0 ? active : 0];
      if (opt && query.length >= SEARCH_MIN && result?.query === query) {
        e.preventDefault();
        go(opt);
      }
    } else if (e.key === "Escape") {
      // Always ours: a search input would otherwise clear itself natively and swallow the key.
      e.preventDefault();
      if (sheetRef.current?.open) sheetRef.current.close();
      else if (open) close();
      else setQ("");
    } else if (e.key === "Tab") {
      close();
    }
  };

  const activeId = active >= 0 && options[active] ? `${uid}-opt-${options[active].key}` : undefined;
  const live =
    status === "loading" ? "Buscando…" : status === "ok" ? (result?.total ? `${result.total} resultados` : "Nenhum resultado") : "";

  const results: ReactNode = (
    <Results
      listId={listId}
      uid={uid}
      query={query}
      status={status}
      slow={slow}
      groups={groups}
      options={options}
      active={active}
      onHover={setActive}
      onPick={go}
      onRetry={() => setAttempt((n) => n + 1)}
    />
  );

  const field = (ref: typeof inputRef, inSheet: boolean) => (
    <div className="relative flex min-w-0 flex-1 items-center">
      <SearchIcon aria-hidden size={18} strokeWidth={ICON_STROKE} className="pointer-events-none absolute left-3 text-text-muted" />
      <input
        ref={ref}
        type="search"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={activeId}
        aria-keyshortcuts={inSheet ? undefined : "/ Control+K Meta+K"}
        aria-label={PLACEHOLDER}
        placeholder={PLACEHOLDER}
        maxLength={SEARCH_MAX}
        autoComplete="off"
        spellCheck={false}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          if (!open) announceOpen("search");
          setOpen(true);
        }}
        onFocus={() => {
          announceOpen("search");
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
        className={`peer w-full min-w-0 truncate rounded-md border border-border-input bg-surface-elevated pr-10 pl-10 text-body-sm text-text-primary transition-colors duration-(--duration-fast) placeholder:text-text-muted hover:border-text-muted focus:border-primary-text [&::-webkit-search-cancel-button]:hidden ${
          inSheet ? "h-11" : "h-10"
        }`}
      />
      {q ? (
        <button
          type="button"
          aria-label="Limpar busca"
          onClick={() => {
            setQ("");
            ref.current?.focus();
          }}
          className="absolute right-1 flex size-8 items-center justify-center rounded-md text-text-muted hover:bg-surface-hover hover:text-text-primary"
        >
          <X aria-hidden size={16} strokeWidth={ICON_STROKE} />
        </button>
      ) : inSheet ? null : (
        <kbd
          aria-hidden
          className="pointer-events-none absolute right-3 flex h-5 min-w-5 items-center justify-center rounded-sm border border-border-strong bg-surface-base px-1 text-caption font-medium text-text-secondary peer-focus:hidden"
        >
          /
        </kbd>
      )}
    </div>
  );

  return (
    <>
      <div ref={wrapRef} className="relative hidden min-w-0 flex-1 md:block md:max-w-[360px] lg:max-w-[480px] xl:max-w-[600px]">
        {field(inputRef, false)}
        {open && !sheetOpen ? (
          <div className="app-pop absolute top-full right-0 left-0 z-40 mt-2 min-w-[min(400px,calc(100vw-32px))] overflow-auto rounded-lg border border-border-strong bg-surface-elevated p-2 shadow-popover max-h-[min(480px,70vh)]">
            {results}
          </div>
        ) : null}
      </div>

      <button
        ref={triggerRef}
        type="button"
        onClick={openSheet}
        aria-label="Buscar"
        aria-haspopup="dialog"
        className="flex size-11 items-center justify-center rounded-md text-text-secondary hover:bg-surface-hover hover:text-text-primary md:hidden"
      >
        <SearchIcon aria-hidden size={20} strokeWidth={ICON_STROKE} />
      </button>
      <dialog
        ref={sheetRef}
        aria-label="Buscar"
        onClose={() => {
          setSheetOpen(false);
          close();
          triggerRef.current?.focus();
        }}
        className="app-sheet m-0 h-dvh max-h-none w-full max-w-none bg-surface-base p-0 text-text-primary open:flex open:flex-col md:hidden"
      >
        <div className="flex shrink-0 items-center gap-2 border-b border-border p-2 pt-[max(8px,env(safe-area-inset-top))]">
          {field(sheetInputRef, true)}
          <button
            type="button"
            onClick={() => sheetRef.current?.close()}
            className="h-11 shrink-0 rounded-md px-3 text-body-sm font-medium text-primary-text hover:bg-surface-hover"
          >
            Cancelar
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-2">{sheetOpen ? results : null}</div>
        {sheetOpen ? (
          <p role="status" aria-live="polite" className="sr-only">
            {live}
          </p>
        ) : null}
      </dialog>

      {/* Outside the modal sheet everything is inert, so the sheet carries its own live region. */}
      {!sheetOpen ? (
        <p role="status" aria-live="polite" className="sr-only">
          {live}
        </p>
      ) : null}
    </>
  );
}

function Results({
  listId,
  uid,
  query,
  status,
  slow,
  groups,
  options,
  active,
  onHover,
  onPick,
  onRetry,
}: {
  listId: string;
  uid: string;
  query: string;
  status: Status;
  slow: boolean;
  groups: SearchGroup[];
  options: Option[];
  active: number;
  onHover: (i: number) => void;
  onPick: (o: Option) => void;
  onRetry: () => void;
}) {
  const message = (text: ReactNode) => <p className="px-3 py-2 text-body-sm text-text-secondary">{text}</p>;
  let body: ReactNode = null;
  if (query.length < SEARCH_MIN) {
    body = message("Digite ao menos 2 letras. A busca procura pelo título em riscos, ações, controles e documentos.");
  } else if (status === "error") {
    body = (
      <div className="flex flex-wrap items-center gap-x-2 px-3 py-2 text-body-sm text-text-secondary">
        <CircleAlert aria-hidden size={16} strokeWidth={ICON_STROKE} className="text-text-muted" />
        Não foi possível buscar agora.
        <button type="button" onClick={onRetry} className="font-medium text-primary-text underline decoration-1 underline-offset-2 hover:text-primary-text-hover">
          Tentar de novo
        </button>
      </div>
    );
  } else if (status === "rate") {
    body = message("Muitas buscas em sequência. Aguarde alguns segundos.");
  } else if ((status === "loading" || status === "idle") && slow) {
    body = (
      <div aria-hidden className="flex flex-col gap-1 p-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton-pulse h-10 rounded-md bg-surface-hover" />
        ))}
      </div>
    );
  } else if (status === "ok" && groups.length === 0) {
    body = message(
      <>
        Nenhum resultado para “{query}”. <span className="text-text-muted">Tente outra palavra do título.</span>
      </>,
    );
  }

  return (
    <>
      {body}
      <div id={listId} role="listbox" aria-label="Resultados da busca">
        {status === "ok"
          ? groups.map((group) => {
              const headerId = `${uid}-grp-${group.kind}`;
              const Icon = KIND_ICON[group.kind];
              return (
                <div key={group.kind} role="group" aria-labelledby={headerId} className="py-1">
                  <div className="flex h-7 items-center justify-between px-3">
                    <span id={headerId} className="text-label uppercase text-text-secondary">
                      {SEARCH_GROUP_LABEL[group.kind]}
                    </span>
                    {group.total > group.items.length ? (
                      <span className="text-caption text-text-muted tabular-nums">
                        {group.items.length} de {group.total}
                      </span>
                    ) : null}
                  </div>
                  {group.items.map((item) => {
                    const index = options.findIndex((o) => o.key === `${group.kind}-${item.id}`);
                    const opt = options[index]!;
                    const selected = index === active;
                    return (
                      <div
                        key={item.id}
                        id={`${uid}-opt-${opt.key}`}
                        role="option"
                        aria-selected={selected}
                        onMouseDown={(e) => e.preventDefault()}
                        onMouseEnter={() => onHover(index)}
                        onClick={() => onPick(opt)}
                        className={`flex min-h-10 cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 max-md:min-h-12 ${selected ? "bg-surface-hover" : ""}`}
                      >
                        <Icon aria-hidden size={16} strokeWidth={ICON_STROKE} className="shrink-0 text-text-muted" />
                        <span className="min-w-0 flex-1 truncate text-body-sm font-medium text-text-primary">
                          <Title title={item.title} query={query} />
                        </span>
                        <span className="shrink-0 text-caption">
                          <Meta group={group} item={item} />
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })
          : null}
      </div>
    </>
  );
}
