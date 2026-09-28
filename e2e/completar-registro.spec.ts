import { test, expect } from "@playwright/test";
import { stubFirebaseAuth, stubPerfilHastaCrearlo } from "./firebase-stub";

// Alta a medias: la cuenta existe en Firebase pero el backend no tiene el perfil.
test("login sin perfil lleva a completar el registro, sin pedir contraseña", async ({ page }) => {
  await page.route("**/pais/", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, code: "ok", data: [{ nombre: "Argentina", iso2: "AR" }] }),
    })
  );
  const email = "ana.perez.test@example.com";
  const idToken = await stubFirebaseAuth(page, email);
  await stubPerfilHastaCrearlo(page, email);

  await page.goto("/acceso");
  await page.getByPlaceholder("nombre@dominio.com").fill(email);
  await page.getByPlaceholder("Tu contraseña").fill("Secure@1");
  await page.getByRole("button", { name: /Iniciar sesión/ }).click();

  await page.waitForURL("**/registro/completar");
  await expect(page.getByRole("heading", { name: "Completá tu registro" })).toBeVisible();
  // El email es el de la cuenta de Firebase y no se edita; la contraseña no se pide.
  await expect(page.getByPlaceholder("nombre@dominio.com")).toHaveValue(email);
  await expect(page.getByPlaceholder("nombre@dominio.com")).toBeDisabled();
  await expect(page.getByPlaceholder("Mínimo 8 caracteres")).toHaveCount(0);

  await page.getByPlaceholder("Ej. Camila Ríos").fill("Ana Pérez");
  await page.getByLabel("País").click();
  await page.getByPlaceholder("Buscar país…").fill("Arg");
  await page.getByRole("option", { name: /Argentina/ }).click();
  await page.getByText("Seleccioná una fecha").click();
  await page.getByRole("button", { name: /Enero 2000/ }).click();
  await page.getByRole("button", { name: "1995" }).click();
  await page.getByRole("button", { name: "15" }).first().click();
  await page.getByLabel("Tipo de identificación").click();
  await page.getByRole("option", { name: "DNI" }).click();
  await page.getByPlaceholder(/Ej\. 30/).fill("30123456");
  await page.getByPlaceholder("Ej. +542615551234").fill("+54261555123");
  await page.locator("#fld-terminos label").click();

  const [req] = await Promise.all([
    page.waitForRequest("**/usuario/create"),
    page.getByRole("button", { name: /Completar registro/ }).click(),
  ]);

  expect(req.headers()["authorization"]).toBe(`Bearer ${idToken}`);
  const body = req.postDataJSON() as { email?: string; password?: string };
  expect(body.email).toBe(email);
  expect(body.password).toBeUndefined();
  await page.waitForURL("**/explorar");
});

// Perfil dado de baja, cuenta de Firebase todavía viva: no se completa nada.
test("login con perfil dado de baja muestra el aviso y no lleva a completar", async ({ page }) => {
  const email = "ana.perez.test@example.com";
  await stubFirebaseAuth(page, email);
  await page.route("**/usuario/me", (route) =>
    route.fulfill({
      status: 403,
      contentType: "application/json",
      body: JSON.stringify({ ok: false, code: "USR.inactivo" }),
    })
  );

  await page.goto("/acceso");
  await page.getByPlaceholder("nombre@dominio.com").fill(email);
  await page.getByPlaceholder("Tu contraseña").fill("Secure@1");
  await page.getByRole("button", { name: /Iniciar sesión/ }).click();

  await expect(page.getByText("Esta cuenta ha sido eliminada.")).toBeVisible();
  await expect(page).toHaveURL(/\/acceso$/);
});
