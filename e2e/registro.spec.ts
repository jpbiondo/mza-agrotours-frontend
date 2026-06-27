import { test, expect } from "@playwright/test";

test.describe("Registro page", () => {
  test("landing view loads with logo, hero text and CTA", async ({ page }) => {
    await page.goto("/registro");
    await expect(page.getByText("Mendoza").first()).toBeVisible();
    await expect(
      page.getByText("Viví la cosecha junto a los productores mendocinos")
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Registrarse" }).first()
    ).toBeVisible();
  });

  test("clicking Registrarse switches to form view with all fields", async ({
    page,
  }) => {
    await page.goto("/registro");
    await page.getByRole("button", { name: "Registrarse" }).first().click();

    await expect(page.getByText("Nombre y apellido")).toBeVisible();
    await expect(page.getByText("Email")).toBeVisible();
    // "País" also appears inside "Seleccionar país" — scope to the field label
    await expect(page.locator('label[for="in-pais"]')).toBeVisible();
    await expect(page.getByText("Fecha de nacimiento")).toBeVisible();
    // Contraseña also appears as placeholder — use the field label
    await expect(page.locator('label[for="in-pw"]')).toBeVisible();
    await expect(page.getByText("términos y condiciones")).toBeVisible();
  });

  test("empty submit shows validation errors", async ({ page }) => {
    await page.goto("/registro?vista=registro");
    // Scroll the submit button into view then click
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.scrollIntoViewIfNeeded();
    await submitBtn.click();
    await expect(
      page.getByText("Este campo es obligatorio").first()
    ).toBeVisible({ timeout: 8000 });
  });

  test("valid form submission shows success view", async ({ page }) => {
    await page.goto("/registro?vista=registro");

    // Nombre
    await page.getByPlaceholder("Ej. Camila Ríos").fill("Ana Pérez");

    // Email
    await page.getByPlaceholder("nombre@dominio.com").fill("ana.perez.test@example.com");

    // Country — custom dropdown, trigger button has id="in-pais"
    await page.locator("#in-pais").click();
    await page.getByPlaceholder("Buscar país…").fill("Arg");
    await page.getByRole("button", { name: /Argentina/ }).click();

    // Date of birth — calendar opens at Jan 2000 by default
    await page.getByText("Seleccioná una fecha").click();
    // Click the month/year header to enter year picker mode
    await page.getByRole("button", { name: /Enero 2000/ }).click();
    await page.getByRole("button", { name: "1995" }).click();
    // Now in Jan 1995 — pick day 15
    await page.getByRole("button", { name: "15" }).first().click();

    // ID type — custom dropdown, trigger button has id="in-tipoId"
    await page.locator("#in-tipoId").click();
    await page.getByRole("button", { name: "DNI" }).click();

    // ID number
    await page.getByPlaceholder(/Ej\. 30/).fill("30123456");

    // Phone
    await page.getByPlaceholder("Ej. +54 261 555 1234").fill("+54261555123");

    // Password
    await page.locator("#in-pw").fill("Secure@1");
    await page.locator("#in-confirm").fill("Secure@1");

    // Terms — click the whole label wrapper
    await page.locator("#fld-terminos label").click();

    // Submit
    await page.locator('button[type="submit"]').click();

    await expect(
      page.getByText("Tu cuenta fue creada correctamente")
    ).toBeVisible({ timeout: 5000 });
  });
});
