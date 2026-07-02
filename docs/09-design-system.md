# Design system

> Extrait du PRD ClubProprete.com v13 — Annexe D. Source de vérité complète : `../PRD_ClubProprete_v13_FINAL.md`.

---

## Annexe D — Design system (tokens & composants)

### D.1 Couleurs (WCAG 2.1 AA validé)
| Token | Hex | Usage | Contraste |
|---|---|---|---|
| navy | #0A2540 | texte principal, titres | ≥ 12:1 sur blanc |
| blue (accent) | #0A66C2 | CTA primaire, liens | ≥ 4.7:1 sur blanc |
| teal (secondaire) | #1E8E7E | succès, badges | ≥ 4.5:1 sur blanc |
| grey | #5A6B7B | texte secondaire | ≥ 4.6:1 sur blanc |
| bg-light | #EEF3F8 | fonds de section | — |
| error | #C0362C | erreurs | ≥ 4.5:1 sur blanc |
| warning | #C77700 | alertes | ≥ 4.5:1 sur blanc |

### D.2 Typographie, espacement, breakpoints
- Typo sans-serif ; échelle H1 32 / H2 26 / H3 23 / H4 21 / body 16 / caption 13 ; line-height 1.5.
- Espacement : 4-8-12-16-24-32-48. Rayons : sm 6 / md 10 / full. Breakpoints : sm 640 / md 768 / lg 1024 / xl 1280.

### D.3 États boutons & formulaires
| Composant | États |
|---|---|
| Button primary | default / hover (assombri 8 %) / active / disabled (opacité 40 %) / loading (spinner + label) |
| Button secondary (ghost) | default / hover (bg-light) / active / disabled |
| Button destructive | rouge error ; confirmation avant action irréversible |
| Input / Select / Tag-input | default / focus (anneau blue) / error (bordure + message) / disabled |
| Formulaire | label au-dessus ; message sous le champ ; validation au blur + soumission ; clé i18n par message |

### D.4 Composants clés
Card (entité/profil/article/offre/**ressource — `cover_image` optionnel, T6**), Modal (focus trap), Toast (aria-live), Drawer (filtres mobile), Table admin (tri/filtre/sélection/keyset), Skeleton, EmptyState, Avatar (présence), Tabs/Stepper, Breadcrumb, SearchBar (autocomplétion). Tous les écrans rappellent les 4 états UI.

---


## D.5 — Évolution v2 (décision produit, juillet 2026)

Directive du propriétaire produit : design moderne, glassmorphism, variantes de
bleu (niche propreté). Appliquée dans `tailwind.config.ts` + `globals.css` :

| Sujet | Décision |
|---|---|
| Typographie | **Geist Sans / Geist Mono** auto-hébergées (`geist` npm, `next/font`), tracking resserré sur les display |
| Palette | 100 % famille bleue : navy `#0A2540` / blue `#0A66C2` / blue-deep `#084D92` / sky `#7CC4F8` (décoratif) / ice `#F2F7FC` / navy-800/900 (dégradés). `teal` conservé pour vérifié/succès. **AA inchangé pour tout texte.** |
| Glassmorphism | Classes `.glass` / `.glass-dark` (backdrop-filter + bord clair + reflet), **surfaces publiques uniquement** (header sticky, hero, auth). Fallback opaque `@supports` + `prefers-reduced-transparency`. Jamais sur les écrans de données denses. |
| Fond hero | `.hero-water` : dégradés radiaux superposés dans la même famille de bleus (jamais de violet) |
| Élévation | `shadow-lift` / `shadow-lift-lg` ; hover CTA = translation 1px + `blue-deep` (pas de filtre brightness) |
| Anti-slop | Pas d'emoji dans l'UI, pas de trois cartes jumelles (bento asymétrique / bande numérotée), 1 famille d'icônes (lucide), 1 accent verrouillé (blue) |

Les contrastes D.1 restent la référence de conformité : `sky` et `ice` sont
décoratifs et interdits comme couleur de texte sur fond clair.
