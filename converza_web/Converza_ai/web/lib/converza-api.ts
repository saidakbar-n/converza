import { authHeaders } from "./auth";

const API_BASE =
  process.env.NEXT_PUBLIC_CONVERZA_API_URL?.replace(/\/$/, "") || "";

/** Resolve backend path: same-origin FastAPI when API_BASE empty; else direct backend URL. */
export function apiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const resolved =
    normalized.startsWith("/api/") || normalized === "/chat"
      ? normalized
      : `/api${normalized}`;
  if (API_BASE) return `${API_BASE}${resolved}`;
  return resolved;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function fetchWorkspace<T>(path: string): Promise<T> {
  const res = await fetch(apiUrl(path), {
    headers: { ...authHeaders() },
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new ApiError(res.status, detail.slice(0, 200));
  }
  return res.json() as Promise<T>;
}

export async function postWorkspace<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(apiUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new ApiError(res.status, detail.slice(0, 200));
  }
  return res.json() as Promise<T>;
}

export async function fetchPublic<T>(path: string): Promise<T> {
  const res = await fetch(apiUrl(path), { cache: "no-store" });
  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new ApiError(res.status, detail.slice(0, 200));
  }
  return res.json() as Promise<T>;
}

export async function postPublic<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(apiUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new ApiError(res.status, detail.slice(0, 200));
  }
  return res.json() as Promise<T>;
}

export interface AuthConfig {
  bot_username: string;
  sales_bot_username?: string;
}

export interface AuthMeResponse {
  ok: boolean;
  org_id: string;
  telegram_id?: number;
  role?: string;
}

export interface TelegramAuthResponse {
  ok: boolean;
  token: string;
  org_id: string;
  role: string;
  first_name?: string;
  username?: string;
}

export interface ConnectionStatus {
  org_id: string;
  connected: boolean;
  business_connection_id?: string | null;
  payments_enabled: boolean;
  subscription_active: boolean;
}

export interface BrandPassport {
  id?: string;
  org_id?: string;
  brand_name?: string;
  industry?: string;
  target_location?: string;
  target_audience?: string;
  core_offer?: string;
  tone?: string;
  brand_voice?: string;
  competitors?: unknown[];
  raw_notes?: string;
}

export async function fetchAuthConfig(): Promise<AuthConfig> {
  return fetchPublic<AuthConfig>("/auth/config");
}

export async function fetchAuthMe(): Promise<AuthMeResponse> {
  return fetchWorkspace<AuthMeResponse>("/auth/me");
}

export async function postTelegramAuth(
  user: Record<string, unknown>,
): Promise<TelegramAuthResponse> {
  return postPublic<TelegramAuthResponse>("/auth/telegram", user);
}

export async function fetchConnectionStatus(): Promise<ConnectionStatus> {
  return fetchWorkspace<ConnectionStatus>("/org/connection-status");
}

export async function fetchBrandPassportByOrg(orgId: string): Promise<BrandPassport | null> {
  try {
    return await fetchWorkspace<BrandPassport>(`/brand-passport/by-org/${orgId}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export interface BrandPassportUpsert {
  org_id: string;
  brand_name: string;
  industry?: string;
  target_location?: string;
  target_audience: string;
  core_offer: string;
  tone?: string;
  brand_voice?: string;
  raw_notes?: string;
}

export async function upsertBrandPassport(payload: BrandPassportUpsert) {
  return postWorkspace<{ ok: boolean; brand_id: string; brand_name: string }>(
    "/dm-closer/onboard",
    payload,
  );
}

export interface AccessRequestPayload {
  full_name: string;
  business_name: string;
  contact: string;
  telegram_username: string;
  message: string;
}

export async function submitAccessRequest(payload: AccessRequestPayload) {
  return postPublic<{ ok: boolean; request_id: string; status: string }>(
    "/access-request",
    payload,
  );
}

export interface CopilotStatus {
  org_id: string;
  ready: boolean;
  reason?: string | null;
  brand_id?: string | null;
  llm: string;
}

export async function fetchCopilotStatus(): Promise<CopilotStatus> {
  return fetchWorkspace<CopilotStatus>("/copilot/status");
}

export interface PipelineLead {
  id: string;
  name: string;
  stage: string;
  last_message: string;
  channel: string;
}

export interface PipelineResponse {
  columns: string[];
  leads: PipelineLead[];
}

export interface CompetitorRival {
  name: string;
  signal: string;
  cadence: string;
  severity: string;
}

export interface DashboardResponse {
  metrics: {
    revenue_mtd: string;
    active_leads: string;
    rendered_videos: string;
  };
  ledger: { id: string | number; time: string; agent: string; action: string }[];
}

export interface MediaJob {
  id: string;
  title: string;
  status: string;
  eta?: string;
  posted?: boolean;
}

export interface MediaResponse {
  queue: MediaJob[];
  completed: MediaJob[];
}

export interface MiloResponse {
  demand_signals: { market: string; trend: string; confidence: string }[];
  hooks: { variant: string; text: string; ctr: string; winner: boolean }[];
  rivals?: CompetitorRival[];
}
