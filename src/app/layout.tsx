import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'ClubProprete — le réseau professionnel de la propreté française',
    template: '%s · ClubProprete',
  },
  description:
    'Le réseau professionnel de toute la propreté française : un profil qui vous rend visible, un réseau qui vous fait travailler, un média que vous écrivez — gratuitement.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
