import { test, expect } from '@playwright/test';

/**
 * E2E — parcours publics sans authentification (fumée MVP 1).
 * Les parcours authentifiés (F-01 inscription → onboarding → fiche) seront
 * activés une fois le projet Supabase provisionné (variables d'env E2E).
 */

test.describe('Pages publiques', () => {
  test("l'accueil affiche la proposition de valeur et les CTA", async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('réseau professionnel');
    await expect(page.getByRole('link', { name: /créer mon profil/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /explorer l'annuaire/i })).toBeVisible();
  });

  test('la navigation principale mène aux sections', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('navigation', { name: 'Navigation principale' }).getByText('Blog').click();
    await expect(page).toHaveURL(/\/blog/);
  });

  test('un type d’annuaire inconnu renvoie 404', async ({ page }) => {
    const res = await page.goto('/annuaire/plombiers');
    expect(res?.status()).toBe(404);
  });

  test('un slug de fiche hors référentiel d’URL renvoie 404', async ({ page }) => {
    const res = await page.goto('/plombier/mon-entreprise');
    expect(res?.status()).toBe(404);
  });

  test('mentions légales et confidentialité sont publiées (LCEN/RGPD)', async ({ page }) => {
    await page.goto('/mentions-legales');
    await expect(page.getByRole('heading', { name: /mentions légales/i })).toBeVisible();
    await page.goto('/confidentialite');
    await expect(page.getByRole('heading', { name: /confidentialité/i })).toBeVisible();
  });

  test('la connexion est accessible et propose le reset', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /mot de passe oublié/i })).toBeVisible();
  });

  test("l'espace membre redirige un anonyme vers /login avec deep-link", async ({ page }) => {
    await page.goto('/espace/profil');
    await expect(page).toHaveURL(/\/login\?next=%2Fespace%2Fprofil/);
  });
});
