import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * Button system v2 (visual-v2 §5.3, brand §41). One primary per page. `secondary` is the v1 name
 * of `outline` and renders the same (the landing scopes pin `outline` to the v1 Obsidian border).
 */
export type ButtonVariant = "primary" | "secondary" | "outline" | "tertiary" | "destructive" | "neutral";

const OUTLINE = "border border-outline text-text-primary hover:bg-outline-hover active:bg-outline-hover active:border-primary";

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active disabled:hover:bg-primary",
  secondary: `${OUTLINE} bg-surface-elevated`,
  outline: OUTLINE,
  tertiary: "text-primary-text underline decoration-1 underline-offset-2 hover:text-primary-text-hover",
  destructive: "bg-danger-fill text-on-fill hover:brightness-110 active:brightness-95",
  neutral: "border border-border-strong bg-surface-elevated text-text-primary hover:bg-surface-hover",
};

export const BUTTON_BASE =
  "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-body-sm font-medium whitespace-nowrap transition-colors duration-(--duration-fast) max-md:min-h-11 disabled:cursor-not-allowed disabled:opacity-40";

export function buttonClass(variant: ButtonVariant = "primary", extra = ""): string {
  return `${BUTTON_BASE} ${VARIANT[variant]} ${extra}`;
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return <button className={buttonClass(variant, className)} {...props} />;
}

export function ButtonLink({
  href,
  variant = "primary",
  className = "",
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={buttonClass(variant, className)}>
      {children}
    </Link>
  );
}
