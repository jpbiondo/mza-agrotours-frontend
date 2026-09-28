import type { Page } from "@playwright/test";

/**
 * Stubbea Firebase Auth (sign-up, login y lookup del usuario) para que las
 * pruebas no creen ni usen cuentas reales. Devuelve el ID token falso, que es
 * el que tiene que llegar como Bearer al backend.
 */
export async function stubFirebaseAuth(page: Page, email: string): Promise<string> {
  const uid = "uid-e2e";
  const idToken = fakeIdToken(uid, email);
  await page.route("**/identitytoolkit.googleapis.com/**", (route) => {
    const url = route.request().url();
    const body = url.includes("accounts:lookup")
      ? {
          kind: "identitytoolkit#GetAccountInfoResponse",
          users: [
            {
              localId: uid,
              email,
              emailVerified: false,
              providerUserInfo: [{ providerId: "password", email, federatedId: email, rawId: email }],
              lastLoginAt: "0",
              createdAt: "0",
            },
          ],
        }
      : // accounts:signUp y accounts:signInWithPassword responden lo mismo.
        { idToken, refreshToken: "refresh", expiresIn: "3600", localId: uid, email, registered: true };
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });
  return idToken;
}

/** JWT sin firma, suficiente para que el SDK de Firebase lea `exp` e `iat`. */
function fakeIdToken(uid: string, email: string): string {
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const ahora = Math.floor(Date.now() / 1000);
  return [
    b64({ alg: "none", typ: "JWT" }),
    b64({ sub: uid, user_id: uid, email, iat: ahora, exp: ahora + 3600, firebase: { sign_in_provider: "password" } }),
    "firma",
  ].join(".");
}

/**
 * /usuario/me responde 404 USR.notFound hasta que se llame a /usuario/create,
 * y después el perfil: así se comporta una cuenta de Firebase sin perfil.
 */
export async function stubPerfilHastaCrearlo(page: Page, email: string): Promise<void> {
  let perfilCreado = false;
  await page.route("**/usuario/create", (route) => {
    perfilCreado = true;
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
  });
  await page.route("**/usuario/me", (route) =>
    route.fulfill(
      perfilCreado
        ? {
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ ok: true, code: "ok", data: { nombre: "Ana Pérez", email, accesos: [] } }),
          }
        : {
            status: 404,
            contentType: "application/json",
            body: JSON.stringify({ ok: false, code: "USR.notFound" }),
          }
    )
  );
}
