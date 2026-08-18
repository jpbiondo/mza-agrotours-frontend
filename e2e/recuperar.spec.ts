import { test, expect } from "@playwright/test";

test("recuperar sin código muestra el formulario de correo", async ({ page }) => {
  await page.goto("/acceso/recuperar");
  await expect(page.getByRole("heading", { name: "Recuperá tu contraseña" })).toBeVisible();
  await expect(page.getByPlaceholder("nombre@dominio.com")).toBeVisible();
});

test("recuperar con oobCode inválido muestra el enlace no válido", async ({ page }) => {
  // Bloqueamos la verificación de Firebase para forzar el fallo del código.
  await page.route("**/identitytoolkit.googleapis.com/**", (route) =>
    route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({ error: { message: "INVALID_OOB_CODE" } }),
    })
  );

  await page.goto("/acceso/recuperar?oobCode=bad-code");
  await expect(page.getByText("El enlace no es válido")).toBeVisible();
});
