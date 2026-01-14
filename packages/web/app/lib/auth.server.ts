import type { Tokens } from "@openauthjs/openauth/client";
import { createClient } from "@openauthjs/openauth/client";
import type { EmailAccount, OAuthAccount } from "@vision/core/subjects";
import { subjects } from "@vision/core/subjects";
import { createCookieSessionStorage, redirect } from "react-router";
import { combineHeaders } from "~/lib/misc.server";
import { StateStore } from "~/lib/store.server";
import { getEnv } from "./env.server";

// Session storage
interface SessionData {
  tokens: Tokens;
  expires?: Date;
}

type SessionFlashData = {
  error: string;
};

export const authSessionStorage = createCookieSessionStorage<
  SessionData,
  SessionFlashData
>({
  cookie: {
    name: "en_session",
    sameSite: "lax",
    path: "/",
    httpOnly: true,
    secrets: ["secret"], // TODO: add secret
    secure: process.env.NODE_ENV === "production",
  },
});

// OpenAuth client
const client = createClient({
  clientID: "web",
  issuer: getEnv().VITE_AUTH_URL,
});

const redirectUri = `${getEnv().VITE_SITE_URL}/auth/callback`;

// Auth functions
export async function authorize(_request: Request, provider?: string) {
  const result = await client.authorize(redirectUri, "code", {
    pkce: true,
    provider: provider,
  });

  const url = new URL(result.url);
  url.searchParams.set("state", result.challenge.state);

  const store = new StateStore();
  store.set(result.challenge.state, result.challenge.verifier, redirectUri);

  const setCookie = store.toSetCookie("oauth2", {});
  const headers = new Headers();
  headers.append("Set-Cookie", setCookie.toString());

  throw redirect(url.toString(), { headers });
}

export async function handleAuthCallback(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const stateUrl = url.searchParams.get("state");
    const store = StateStore.fromRequest(request, "oauth2");

    if (!code) throw new ReferenceError("Missing authorization code.");
    if (!stateUrl) throw new ReferenceError("Missing state in URL.");
    if (!store.state) throw new ReferenceError("Missing state in cookie.");
    if (store.state !== stateUrl) {
      throw new RangeError(
        `State mismatch. Cookie: ${store.state}, URL: ${stateUrl}`,
      );
    }
    if (!store.codeVerifier) {
      throw new ReferenceError("Missing code verifier in cookie.");
    }

    const result = await client.exchange(code, redirectUri, store.codeVerifier);
    if (result.err) throw result.err;

    const verified = await client.verify(subjects, result.tokens.access, {
      refresh: result.tokens.refresh,
      issuer: getEnv().VITE_AUTH_URL,
    });

    if (verified.err || verified.subject.type !== "account") {
      throw redirect("/", {
        headers: await destroySession(request),
      });
    }

    const session = await authSessionStorage.getSession();
    session.set("tokens", result.tokens);
    session.set("expires", new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)); // 30 days

    const cleanCookie = StateStore.cleanCookie("oauth2");
    const sessionCookie = await authSessionStorage.commitSession(session);

    const headers = new Headers();
    headers.append("Set-Cookie", cleanCookie.toString());
    headers.append("Set-Cookie", sessionCookie);

    return { headers };
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }
    console.error("Error handling callback:", error);
    throw redirect("/logout");
  }
}

export async function requireSession(
  request: Request,
  { redirectTo }: { redirectTo?: string | null } = {},
) {
  const session = await authSessionStorage.getSession(
    request.headers.get("Cookie"),
  );
  const tokens = session.get("tokens");

  if (!tokens?.access) {
    throw redirect(getLoginRedirectUrl(request, redirectTo));
  }

  const verified = await client.verify(subjects, tokens.access, {
    refresh: tokens.refresh,
    issuer: getEnv().VITE_AUTH_URL,
  });

  if (verified.err || verified.subject.type !== "account") {
    throw redirect("/", {
      headers: await destroySession(request),
    });
  }

  let headers = new Headers();
  if (verified.tokens) {
    const newSession = await authSessionStorage.getSession();
    newSession.set("tokens", verified.tokens);
    newSession.set("expires", new Date(Date.now() + 1000 * 60 * 60 * 24 * 30));
    headers.append(
      "Set-Cookie",
      await authSessionStorage.commitSession(newSession),
    );
  }

  return {
    tokens: tokens,
    properties: verified.subject.properties,
    headers,
  };
}

export async function requireAnonymous(request: Request) {
  const session = await authSessionStorage.getSession(
    request.headers.get("Cookie"),
  );
  const tokens = session.get("tokens");

  if (tokens?.access) {
    throw redirect("/");
  }
}

export async function requireEmailFromSession(
  request: Request,
  { redirectTo }: { redirectTo?: string | null } = {},
) {
  const session = await authSessionStorage.getSession(
    request.headers.get("Cookie"),
  );
  const tokens = session.get("tokens");

  if (!tokens?.access) {
    throw redirect(getLoginRedirectUrl(request, redirectTo));
  }

  try {
    // Decode JWT payload without verification (since we trust it's valid in protected routes)
    const payload = JSON.parse(atob(tokens.access.split(".")[1]));

    if (payload.properties.email) {
      return payload.properties.email as string;
    }

    throw redirect(getLoginRedirectUrl(request, redirectTo));
  } catch {
    throw redirect(getLoginRedirectUrl(request, redirectTo));
  }
}

export async function handleLogout(
  request: Request,
  {
    redirectTo = "/",
    responseInit,
  }: {
    redirectTo?: string;
    responseInit?: ResponseInit;
  } = {},
) {
  const headers = await destroySession(request);

  throw redirect(redirectTo, {
    ...responseInit,
    headers: combineHeaders(headers, responseInit?.headers),
  });
}

// Helper functions
async function destroySession(request: Request) {
  const session = await authSessionStorage.getSession(
    request.headers.get("Cookie"),
  );
  const headers = new Headers();
  headers.append(
    "Set-Cookie",
    await authSessionStorage.destroySession(session),
  );
  return headers;
}

function getLoginRedirectUrl(
  request: Request,
  redirectTo?: string | null,
): string {
  const requestUrl = new URL(request.url);
  const to =
    redirectTo === null
      ? null
      : (redirectTo ?? `${requestUrl.pathname}${requestUrl.search}`);
  const params = to ? new URLSearchParams({ redirectTo: to }) : null;
  const loginRedirect = ["/login", params?.toString()]
    .filter(Boolean)
    .join("?");
  return loginRedirect;
}

// Export types for convenience
export type { EmailAccount, OAuthAccount };
