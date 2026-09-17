import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "tertiary";

/** Button system per brand §41 and tokens.md §2. One primary per page. */
const VARIANT: Record<Variant, string> = {
  primary:
    "bg-electric-blue text-white hover:bg-primary-hover active:bg-primary-active disabled:hover:bg-electric-blue",
  secondary: "border border-text-primary bg-surface-elevated text-text-primary hover:bg-surface-hover",
  tertiary: "text-info-text underline decoration-1 underline-offset-2 hover:text-info-fill",
};

const BASE =
  "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-body-sm font-medium transition-colors duration-(--duration-fast) disabled:cursor-not-allowed disabled:opacity-40";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={`${BASE} ${VARIANT[variant]} ${className}`} {...props} />;
}

export function ButtonLink({
  href,
  variant = "primary",
  children,
}: {
  href: string;
  variant?: Variant;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={`${BASE} ${VARIANT[variant]}`}>
      {children}
    </Link>
  );
}
