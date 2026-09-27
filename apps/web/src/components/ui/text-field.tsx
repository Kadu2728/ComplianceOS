import type { InputHTMLAttributes } from "react";

/** Labeled input with accessible error (visual-v2 §5.7: `border-input` boundary ≥ 3:1). */
export function TextField({
  id,
  label,
  error,
  hint,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  error?: string;
  hint?: string;
}) {
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
    .filter(Boolean)
    .join(" ");
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-body-sm font-medium text-text-primary">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={[
          "h-10 rounded-md border bg-surface-elevated px-3 text-body text-text-primary transition-colors duration-(--duration-fast) max-md:h-11 focus:border-primary-text",
          "placeholder:text-text-muted disabled:cursor-not-allowed disabled:opacity-40",
          error ? "border-danger-text" : "border-border-input hover:border-text-muted",
          className,
        ].join(" ")}
        {...props}
      />
      {hint ? (
        <p id={`${id}-hint`} className="text-caption text-text-secondary">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-caption text-danger-text">
          {error}
        </p>
      ) : null}
    </div>
  );
}
