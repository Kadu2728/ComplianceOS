export function AuthHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6 flex flex-col gap-1">
      <h1 className="text-h2">{title}</h1>
      {description ? <p className="text-body-sm text-text-secondary">{description}</p> : null}
    </div>
  );
}
