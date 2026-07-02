import type { Config } from 'tailwindcss';

/**
 * Design system ClubProprete v2 — palette 100 % bleus (industrie de la propreté :
 * eau, netteté, confiance), tokens validés WCAG 2.1 AA pour le texte.
 * Base : docs/09-design-system.md. Les nuances décoratives (sky, ice) ne
 * servent JAMAIS de couleur de texte sur fond clair.
 */
const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
    },
    extend: {
      colors: {
        // — Cœur (texte & actions, AA sur blanc) —
        navy: '#0A2540', // texte principal, titres (≥12:1)
        blue: '#0A66C2', // CTA primaire, liens (≥4.7:1)
        'blue-deep': '#084D92', // hover CTA, états actifs (≥6:1)
        teal: '#1E8E7E', // succès, badge vérifié (≥4.5:1)
        grey: '#5A6B7B', // texte secondaire (≥4.6:1)
        error: '#C0362C',
        warning: '#C77700',
        // — Variantes de bleu (fonds & décoratif uniquement) —
        ice: '#F2F7FC', // fond de section froid
        'bg-light': '#EEF3F8', // fond de section (compat v1)
        sky: '#7CC4F8', // décoratif : lueurs, traits, illustrations
        'navy-800': '#0E3057', // dégradés du hero
        'navy-900': '#071A30', // fond sombre profond
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        h1: ['2rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        'h1-lg': ['3.25rem', { lineHeight: '1.08', letterSpacing: '-0.03em' }],
        h2: ['1.625rem', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
        h3: ['1.4375rem', { lineHeight: '1.35' }],
        h4: ['1.3125rem', { lineHeight: '1.4' }],
        body: ['1rem', { lineHeight: '1.5' }],
        caption: ['0.8125rem', { lineHeight: '1.5' }],
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '6': '24px',
        '8': '32px',
        '12': '48px',
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '16px',
        full: '9999px',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(10, 37, 64, 0.10), inset 0 1px 0 rgba(255,255,255,0.55)',
        'glass-dark': '0 8px 32px rgba(3, 12, 24, 0.45), inset 0 1px 0 rgba(255,255,255,0.08)',
        lift: '0 2px 8px rgba(10, 37, 64, 0.08)',
        'lift-lg': '0 12px 32px rgba(10, 37, 64, 0.14)',
      },
    },
  },
  plugins: [],
};

export default config;
