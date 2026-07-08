import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export async function getSupabaseAccessToken() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  const session = (await supabase.auth.getSession()).data.session;
  return session?.access_token ?? null;
}

export async function authHeaders(init?: HeadersInit) {
  const headers = new Headers(init);
  const token = await getSupabaseAccessToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return headers;
}
