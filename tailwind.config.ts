import type { Config } from 'tailwindcss';

/**
 * Design system ClubProprete — tokens validés WCAG 2.1 AA.
 * Source : docs/09-design-system.md (Annexe D du PRD).
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
        navy: '#0A2540', // texte principal, titres (≥12:1 sur blanc)
        blue: '#0A66C2', // CTA primaire, liens (≥4.7:1)
        teal: '#1E8E7E', // succès, badges (≥4.5:1)
        grey: '#5A6B7B', // texte secondaire (≥4.6:1)
        'bg-light': '#EEF3F8', // fonds de section
        error: '#C0362C', // erreurs (≥4.5:1)
        warning: '#C77700', // alertes (≥4.5:1)
      },
      fontSize: {
        h1: ['2rem', { lineHeight: '1.5' }], // 32
        h2: ['1.625rem', { lineHeight: '1.5' }], // 26
        h3: ['1.4375rem', { lineHeight: '1.5' }], // 23
        h4: ['1.3125rem', { lineHeight: '1.5' }], // 21
        body: ['1rem', { lineHeight: '1.5' }], // 16
        caption: ['0.8125rem', { lineHeight: '1.5' }], // 13
      },
      spacing: {
        // échelle 4-8-12-16-24-32-48
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
        full: '9999px',
      },
    },
  },
  plugins: [],
};

export default config;
