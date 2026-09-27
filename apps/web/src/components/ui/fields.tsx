import type { SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const BASE =
  "rounded-md border border-border-input bg-surface-elevated px-3 text-body text-text-primary transition-colors duration-(--duration-fast) hover:border-text-muted focus:border-primary-text disabled:cursor-not-allowed disabled:opacity-40";

export function SelectField({
  id,
  label,
  hint,
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { id: string; label: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-body-sm font-medium text-text-primary">
        {label}
      </label>
      <select id={id} className={`h-10 max-md:h-11 ${BASE} ${className}`} {...props}>
        {children}
      </select>
      {hint ? <p className="text-caption text-text-secondary">{hint}</p> : null}
    </div>
  );
}

export function TextAreaField({
  id,
  label,
  hint,
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { id: string; label: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-body-sm font-medium text-text-primary">
        {label}
      </label>
      <textarea id={id} className={`min-h-24 py-2 ${BASE} ${className}`} {...props} />
      {hint ? <p className="text-caption text-text-secondary">{hint}</p> : null}
    </div>
  );
}
