import Link from 'next/link';

/**
 * Coquille des pages d'auth — fond « eau claire », panneau de verre.
 * Redirection si déjà connecté : middleware.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="hero-water flex min-h-[100dvh] flex-col">
      <header className="flex h-16 items-center justify-center">
        <Link href="/" className="text-h4 font-bold tracking-tight text-white">
          Club<span className="text-sky">Proprete</span>
        </Link>
      </header>
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-8">
        <div className="glass rounded-lg bg-white/90 p-6 sm:p-8">{children}</div>
        <p className="mt-4 text-center text-caption text-white/60">
          Plateforme 100 % gratuite — vos données ne sont jamais revendues.
        </p>
      </main>
    </div>
  );
}
