import { test, expect } from "@playwright/test";

test.describe("Registro page", () => {
  test("carga directamente el formulario (sin vista de landing ni ?vista)", async ({ page }) => {
    await page.goto("/registro");

    await expect(page.getByRole("heading", { name: "Creá tu cuenta" })).toBeVisible();
    await expect(page.getByText("Nombre y apellido")).toBeVisible();
    await expect(page.getByText("Email")).toBeVisible();
    // "País" también aparece dentro de "Seleccionar país" — acotamos al label del campo
    await expect(page.locator('label[for="in-pais"]')).toBeVisible();
    await expect(page.getByText("Fecha de nacimiento")).toBeVisible();
    await expect(page.locator('label[for="in-pw"]')).toBeVisible();
    await expect(page.getByText("términos y condiciones")).toBeVisible();
  });

  test("usuario ya logueado es redirigido fuera de /registro", async ({ page }) => {
    await page.goto("/registro");
    await page.waitForFunction(() => Boolean((window as unknown as { __authStore?: unknown }).__authStore));
    await page.evaluate(() => {
      (window as unknown as {
        __authStore: { getState: () => { setSession: (s: { nombre: string; email: string; roles: string[] }) => void } };
      }).__authStore
        .getState()
        .setSession({ nombre: "Camila Ríos", email: "camila.rios@gmail.com", roles: ["visitante"] });
    });
    await page.waitForURL("**/explorar");
    expect(page.url()).toContain("/explorar");
  });

  test("empty submit shows validation errors", async ({ page }) => {
    await page.goto("/registro");
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.scrollIntoViewIfNeeded();
    await submitBtn.click();
    await expect(
      page.getByText("Este campo es obligatorio").first()
    ).toBeVisible({ timeout: 8000 });
  });

  test("submit válido crea la cuenta contra el backend", async ({ page }) => {
    // El backend crea la cuenta (Firebase Admin SDK); lo stubbeamos en el e2e.
    // El auto-login posterior usa Firebase real, así que sólo verificamos el alta.
    await page.route("**/usuario/create", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      })
    );

    await page.goto("/registro");

    await page.getByPlaceholder("Ej. Camila Ríos").fill("Ana Pérez");
    await page.getByPlaceholder("nombre@dominio.com").fill("ana.perez.test@example.com");

    // País — dropdown custom, el trigger tiene id="in-pais"
    await page.locator("#in-pais").click();
    await page.getByPlaceholder("Buscar país…").fill("Arg");
    await page.getByRole("button", { name: /Argentina/ }).click();

    // Fecha de nacimiento — el calendario abre en Enero 2000
    await page.getByText("Seleccioná una fecha").click();
    await page.getByRole("button", { name: /Enero 2000/ }).click();
    await page.getByRole("button", { name: "1995" }).click();
    await page.getByRole("button", { name: "15" }).first().click();

    // Tipo de identificación
    await page.locator("#in-tipoId").click();
    await page.getByRole("button", { name: "DNI" }).click();

    await page.getByPlaceholder(/Ej\. 30/).fill("30123456");
    await page.getByPlaceholder("Ej. +54 261 555 1234").fill("+54261555123");

    await page.locator("#in-pw").fill("Secure@1");
    await page.locator("#in-confirm").fill("Secure@1");
    await page.locator("#fld-terminos label").click();

    const [req] = await Promise.all([
      page.waitForRequest("**/usuario/create"),
      page.locator('button[type="submit"]').click(),
    ]);

    expect(req.method()).toBe("POST");
    expect((req.postDataJSON() as { email?: string }).email).toBe("ana.perez.test@example.com");
    // Tras crear la cuenta pasamos al estado de alta+login automático.
    await expect(page.getByText("Creando tu cuenta…").first()).toBeVisible();
  });
});
