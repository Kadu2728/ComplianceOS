import type { ReactNode } from "react";

/**
 * Device frames for the hero (landing-v2 §4.3.3). Presentational server components: the children
 * are the screenshots. Every size is relative to the visual box, so one component serves every
 * width; the XL perspective lives on the laptop group only (the phone stays flat, giving depth).
 */
export function LaptopFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative z-[1] mb-4 w-[88%] xl:origin-left xl:[transform:perspective(1800px)_rotateY(10deg)]">
      <div className="mx-auto w-[93.2%] rounded-t-[10px] rounded-b-[4px] border border-border-strong bg-surface-base px-1.5 pt-1.5 pb-2.5 md:rounded-t-[14px] md:rounded-b-[6px] md:px-2 md:pt-2 md:pb-3.5">
        <div className="aspect-[16/10] overflow-hidden rounded-[4px] bg-surface-elevated md:rounded-[6px]">{children}</div>
      </div>
      <div className="relative h-2.5 rounded-b-lg border-t border-border-strong bg-border md:h-3.5 md:rounded-b-xl">
        <span className="absolute top-0 left-1/2 h-[3px] w-[16%] -translate-x-1/2 rounded-b-[4px] bg-surface-elevated md:h-1" />
      </div>
    </div>
  );
}

export function PhoneFrame({ children, overlay, className = "" }: { children: ReactNode; overlay?: ReactNode; className?: string }) {
  return (
    <div className={`absolute right-0 bottom-0 z-[2] w-[26%] md:w-[20%] ${className}`}>
      {overlay}
      <div className="rounded-[16px] border border-border-strong bg-surface-base p-1 md:rounded-[22px] md:p-[5px]">
        <div className="aspect-[390/844] overflow-hidden rounded-[12px] bg-surface-elevated md:rounded-[17px]">{children}</div>
      </div>
    </div>
  );
}
