import { test, expect } from "@playwright/test";

test("/cuenta es protegida: sin sesión redirige a /acceso", async ({ page }) => {
  await page.goto("/cuenta");
  await page.waitForURL("**/acceso");
  expect(page.url()).toContain("/acceso");
});
