const BAR = "skeleton-pulse rounded-[6px] bg-surface-hover";
const CARD = "rounded-lg border border-border bg-surface-elevated p-4 sm:p-6";

function Rows({ n }: { n: number }) {
  return (
    <div className="mt-4 flex flex-col gap-2">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className={`${BAR} h-8`} />
      ))}
    </div>
  );
}

/**
 * Visão geral skeleton (visual-v2 §4.7): the same grid and final heights as the page, so nothing
 * jumps when the data arrives. The route group keeps the generic `(app)/loading.tsx` for the rest.
 */
export default function Loading() {
  return (
    <div role="status" aria-busy="true" aria-label="Carregando visão geral">
      <span className="sr-only">Carregando visão geral…</span>
      <div className="mb-6">
        <div className={`${BAR} h-7 w-2/5`} />
        <div className={`${BAR} mt-2 h-3.5 w-3/5`} />
      </div>
      <div className="grid grid-cols-12 gap-4 lg:gap-6">
        <div className={`${CARD} col-span-12 xl:col-span-6`}>
          <div className={`${BAR} h-4 w-40`} />
          <div className="mt-4 flex items-center gap-8">
            <div className="size-32 shrink-0 rounded-pill border-10 border-surface-hover sm:size-40 sm:border-12" />
            <div className={`${BAR} h-[120px] flex-1`} />
          </div>
        </div>
        <div className={`${CARD} col-span-12 sm:col-span-6 xl:col-span-3`}>
          <div className={`${BAR} h-4 w-32`} />
          <Rows n={4} />
        </div>
        <div className={`${CARD} col-span-12 sm:col-span-6 xl:col-span-3`}>
          <div className={`${BAR} size-10`} />
          <div className={`${BAR} mt-3 h-4 w-3/4`} />
          <div className={`${BAR} mt-2 h-4 w-1/2`} />
          <div className={`${BAR} mt-6 h-10`} />
        </div>
        <div className="col-span-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:gap-6 wide:grid-cols-6">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className={`${CARD} min-h-28 sm:min-h-42`}>
              <div className={`${BAR} size-10`} />
              <div className={`${BAR} mt-3 h-4 w-2/3`} />
              <div className={`${BAR} mt-2 h-3 w-full`} />
            </div>
          ))}
        </div>
        {[0, 1].map((i) => (
          <div key={i} className={`${CARD} col-span-12 xl:col-span-6`}>
            <div className={`${BAR} h-4 w-40`} />
            <Rows n={5} />
          </div>
        ))}
      </div>
    </div>
  );
}
