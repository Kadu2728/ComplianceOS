import Link from "next/link";

/**
 * Temporary text wordmark (decision D15: the approved symbol is not in the repository).
 * The empty 24px slot reserves space for the symbol so its arrival does not reflow the shell.
 * Do not invent a mark here.
 */
export function Wordmark() {
  return (
    <Link href="/" className="flex h-14 items-center gap-2 px-3 text-text-primary">
      <span aria-hidden className="inline-block size-6 shrink-0" />
      <span className="text-[16px] font-semibold tracking-[-0.01em]">Compliance OS</span>
    </Link>
  );
}
