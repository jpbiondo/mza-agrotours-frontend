import { test, expect } from "@playwright/test";

// El navbar único (SiteHeader) debe mostrar CTAs de invitado o el menú de cuenta
// según el estado de sesión del store, y en TODAS las pantallas (landing + app).
// Las aserciones se acotan al <header> (el footer también tiene links de sesión).

type TestStore = {
  getState: () => {
    setSession: (s: { nombre: string; email: string; roles: string[] }) => void;
    clear: () => void;
  };
};

async function simularLogin(page: import("@playwright/test").Page) {
  await page.waitForFunction(() => Boolean((window as unknown as { __authStore?: unknown }).__authStore));
  await page.evaluate(() => {
    (window as unknown as { __authStore: TestStore }).__authStore
      .getState()
      .setSession({
        nombre: "Camila Ríos",
        email: "camila.rios@gmail.com",
        roles: ["visitante", "productor", "admin"],
      });
  });
}

test("landing: invitado ve los CTA de sesión, no el menú de cuenta", async ({ page }) => {
  await page.goto("/");
  const header = page.locator("header");
  await expect(header.getByRole("link", { name: /Iniciar sesión/i })).toBeVisible();
  await expect(header.getByRole("link", { name: /Registrarse/i })).toBeVisible();
  await expect(header.getByRole("button", { name: "Tu cuenta" })).toHaveCount(0);
});

test("landing: al iniciar sesión, el navbar muestra la cuenta y oculta los CTA", async ({ page }) => {
  await page.goto("/");
  const header = page.locator("header");
  await expect(header.getByRole("link", { name: /Iniciar sesión/i })).toBeVisible();

  await simularLogin(page);

  await expect(header.getByRole("button", { name: "Tu cuenta" })).toBeVisible();
  await expect(header.getByRole("link", { name: /Iniciar sesión/i })).toHaveCount(0);

  // Los accesos a los paneles aparecen según los roles.
  await header.getByRole("button", { name: "Tu cuenta" }).click();
  await expect(page.getByRole("menuitem", { name: /Panel de productor/i })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: /Panel de administrador/i })).toBeVisible();
});

test("app (/explorar): invitado también ve los CTA (navbar unificada)", async ({ page }) => {
  await page.goto("/explorar");
  const header = page.locator("header");
  await expect(header.getByRole("link", { name: /Iniciar sesión/i })).toBeVisible();
  await expect(header.getByRole("button", { name: "Tu cuenta" })).toHaveCount(0);
});
