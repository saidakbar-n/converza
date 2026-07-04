const AUTH_STORAGE_KEY = "converza_auth";

export interface ConverzaAuth {
  token: string;
  orgId: string;
  user?: { id?: number; first_name?: string; username?: string };
}

export function getStoredAuth(): ConverzaAuth | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      token?: string;
      orgId?: string;
      user?: ConverzaAuth["user"];
    };
    if (!parsed.token) return null;
    return {
      token: parsed.token,
      orgId: parsed.orgId || "",
      user: parsed.user,
    };
  } catch {
    return null;
  }
}

export function authHeaders(): HeadersInit {
  const auth = getStoredAuth();
  if (!auth?.token) return {};
  return { Authorization: `Bearer ${auth.token}` };
}
