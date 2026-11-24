import Link from "next/link";

// Página para endereços que não existem no Portal (no lugar da 404 padrão, em inglês).
export default function NotFound() {
  return <main className="not-found">
    <div className="not-found-card">
      <span className="not-found-code" aria-hidden="true">404</span>
      <h1>Página não encontrada</h1>
      <p>O endereço pode ter mudado ou sido digitado errado. Tudo do Portal fica no menu da página inicial.</p>
      <Link className="primary-button" href="/">Voltar para o Portal</Link>
    </div>
  </main>;
}
