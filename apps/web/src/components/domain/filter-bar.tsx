import Link from "next/link";
import { FILTER_SELECT, FilterForm } from "./filter-form";

export type SelectFilter = {
  name: string;
  label: string; // accessible name; the first option reads as the "all" state
  value: string | undefined;
  options: { value: string; label: string }[];
  all: string;
};
export type ToggleFilter = { name: string; label: string; checked: boolean };

/**
 * Server component: selects (and optional checkbox toggles) bound to URL search params.
 * `count` is the filtered total; `clear` is the unfiltered list href.
 */
export function FilterBar({
  action,
  selects,
  toggles = [],
  count,
  noun,
  active,
}: {
  action: string;
  selects: SelectFilter[];
  toggles?: ToggleFilter[];
  count: number;
  noun: [string, string];
  active: boolean;
}) {
  // Remount when the URL state changes (e.g. "Limpar filtros"), so uncontrolled selects follow it.
  const stateKey = [...selects.map((f) => f.value ?? ""), ...toggles.map((t) => String(t.checked))].join("|");
  return (
    <FilterForm key={stateKey} action={action}>
      {selects.map((f) => (
        <label key={f.name} className="inline-flex items-center gap-2 text-body-sm text-text-secondary">
          <span className="sr-only">{f.label}</span>
          <select name={f.name} defaultValue={f.value ?? ""} aria-label={f.label} className={FILTER_SELECT}>
            <option value="">{f.all}</option>
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      ))}
      {toggles.map((t) => (
        <label key={t.name} className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-border px-3 text-body-sm text-text-primary has-checked:border-electric-blue has-checked:bg-info-tint has-checked:text-info-text">
          <input type="checkbox" name={t.name} value="1" defaultChecked={t.checked} className="size-4 accent-electric-blue" />
          {t.label}
        </label>
      ))}
      <span className="ml-auto text-body-sm tabular-nums text-text-secondary" aria-live="polite">
        {count} {count === 1 ? noun[0] : noun[1]}
        {active ? (
          <>
            {" · "}
            <Link href={action} className="text-info-text underline underline-offset-2">
              Limpar filtros
            </Link>
          </>
        ) : null}
      </span>
    </FilterForm>
  );
}
