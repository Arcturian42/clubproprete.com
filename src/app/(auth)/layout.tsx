import Link from 'next/link';

/** Coquille des pages d'auth — sobre, centrée. Redirection si connecté : middleware. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-bg-light">
      <header className="flex h-16 items-center justify-center">
        <Link href="/" className="text-h4 font-bold text-navy">
          Club<span className="text-blue">Proprete</span>
        </Link>
      </header>
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-8">
        <div className="rounded-md border border-grey/20 bg-white p-6 shadow-sm">{children}</div>
      </main>
    </div>
  );
}
