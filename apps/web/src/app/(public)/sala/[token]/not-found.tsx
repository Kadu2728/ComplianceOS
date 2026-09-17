/** Same page for an unknown, expired or revoked link (threat model T1). */
export default function SalaNaoEncontrada() {
  return (
    <div className="mx-auto max-w-[520px] rounded-lg border border-border bg-surface-elevated p-6 md:p-8">
      <p className="text-label uppercase text-text-secondary">Sala de compliance</p>
      <h1 className="mt-2 text-h2">Este link não está disponível</h1>
      <p className="mt-3 text-body text-text-secondary">
        O link pode ter expirado, ter sido revogado ou estar incorreto. Peça um novo link à organização que o compartilhou com você.
      </p>
    </div>
  );
}
