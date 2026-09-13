/** Layout-stable loading placeholders (UX §21). Dimensions match the final content. */
export function PageSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div aria-busy="true" aria-label="Carregando" className="flex flex-col gap-8">
      <div className="h-10 w-2/5 rounded-md bg-surface-hover" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="h-10 w-full rounded-md bg-surface-hover" />
        ))}
      </div>
    </div>
  );
}
