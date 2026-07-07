import { authHeaders, clearStoredAuth, getStoredAuth, setStoredAuth, type ConverzaAuth } from "./auth";

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

export async function patchWorkspace<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(apiUrl(path), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
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

export interface BrandPricingItem {
  name?: string;
  tier?: string;
  price?: string;
  description?: string;
  features?: string[];
}

export interface BrandFaqItem {
  question: string;
  answer: string;
}

export interface BrandObjectionItem {
  objection: string;
  response: string;
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
  pricing?: BrandPricingItem[];
  faq?: BrandFaqItem[];
  objections?: BrandObjectionItem[];
  competitors?: (string | Record<string, unknown>)[];
  raw_notes?: string;
}

export async function fetchAuthConfig(): Promise<AuthConfig> {
  return fetchPublic<AuthConfig>("/auth/config");
}

export async function fetchAuthMe(): Promise<AuthMeResponse> {
  return fetchWorkspace<AuthMeResponse>("/auth/me");
}

/** Validate JWT with backend; refresh org_id from /api/auth/me. */
export async function validateSession(): Promise<ConverzaAuth | null> {
  const stored = getStoredAuth();
  if (!stored?.token) return null;
  try {
    const me = await fetchAuthMe();
    if (!me.ok) {
      clearStoredAuth();
      return null;
    }
    const refreshed: ConverzaAuth = {
      ...stored,
      orgId: me.org_id || stored.orgId,
    };
    if (refreshed.orgId !== stored.orgId) {
      setStoredAuth(refreshed);
    }
    return refreshed;
  } catch {
    clearStoredAuth();
    return null;
  }
}

export async function postTelegramAuth(
  user: Record<string, unknown>,
): Promise<TelegramAuthResponse> {
  return postPublic<TelegramAuthResponse>("/auth/telegram", user);
}

export async function fetchConnectionStatus(): Promise<ConnectionStatus> {
  return fetchWorkspace<ConnectionStatus>("/org/connection-status");
}

export interface OrgSubscription {
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  amount_uzs: number | null;
  last_payment_at: string | null;
  plan: string;
  subscription_payments_configured: boolean;
  subscription_price_uzs: number;
  upgrade_bot_username: string;
  upgrade_deep_link: string;
}

export interface SubscriptionPayment {
  id: string;
  amount_uzs: number;
  period_start: string | null;
  period_end: string | null;
  paid_at: string;
  telegram_payment_charge_id?: string | null;
}

export async function fetchOrgSubscription(): Promise<OrgSubscription> {
  return fetchWorkspace<OrgSubscription>("/org/subscription");
}

export async function fetchSubscriptionPayments(): Promise<SubscriptionPayment[]> {
  const res = await fetchWorkspace<{ payments: SubscriptionPayment[] }>(
    "/org/subscription/payments",
  );
  return res.payments || [];
}

export async function startSubscriptionCheckout(): Promise<{
  ok: boolean;
  message: string;
  already_active?: boolean;
}> {
  return postWorkspace("/org/subscription/checkout");
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
  pricing?: BrandPricingItem[];
  faq?: BrandFaqItem[];
  objections?: BrandObjectionItem[];
  competitors?: string[];
  raw_notes?: string;
}

export async function parseBrandPassportPdf(
  files: File[],
): Promise<{ ok: boolean; files_processed: number; passport: BrandPassport }> {
  const fd = new FormData();
  files.forEach((file) => fd.append("files", file, file.name));
  const res = await fetch(apiUrl("/dm-closer/parse-pdf"), {
    method: "POST",
    headers: { ...authHeaders() },
    body: fd,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new ApiError(res.status, detail.slice(0, 200));
  }
  return res.json() as Promise<{ ok: boolean; files_processed: number; passport: BrandPassport }>;
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
  condition?: string;
  last_message: string;
  channel: string;
  updated_at?: string;
}

export interface PipelineResponse {
  columns: string[];
  leads: PipelineLead[];
}

export type ProspectCondition = "cold" | "warm" | "purchasing" | "closed";

export interface ProspectMessage {
  id: string;
  content: string;
  direction: string;
  sent_by: string;
  created_at: string;
}

export async function fetchProspectMessages(
  prospectId: string,
): Promise<{ messages: ProspectMessage[] }> {
  return fetchWorkspace(`/workspace/prospects/${prospectId}/messages`);
}

export async function updateProspectCondition(
  prospectId: string,
  client_condition: ProspectCondition,
): Promise<{ ok: boolean; stage: string; client_condition: string }> {
  return patchWorkspace(`/workspace/prospects/${prospectId}`, { client_condition });
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
  output_urls?: {
    url?: string;
    video_url?: string;
    asset_url?: string;
    anchor_frame_url?: string;
  };
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

export interface PipelineRunSummary {
  id: string;
  user_message: string;
  status: string;
  stage: string;
  campaign_name: string;
  strategic_thesis: string;
  target_platforms: string[];
  started_at: string | null;
  completed_at: string | null;
}

export interface PipelineRunsResponse {
  runs: PipelineRunSummary[];
}

export interface PipelineNodeRun {
  id?: string;
  node_id: string;
  agent_type: string;
  status: string;
  input_payload?: Record<string, unknown>;
  output_payload?: Record<string, unknown>;
}

export interface PipelineRunDetail {
  run: {
    id: string;
    user_message: string;
    status: string;
    stage: string;
    dag_plan?: DagPlanPayload | null;
    started_at?: string | null;
    completed_at?: string | null;
  };
  nodes: PipelineNodeRun[];
}

export interface DagPlanPayload {
  strategic_thesis: string;
  campaign_name: string;
  target_platforms: string[];
  nodes: {
    node_id: string;
    agent_type: string;
    depends_on?: string[];
    brief?: Record<string, unknown>;
  }[];
}

export interface PipelineStartOptions {
  message: string;
  brandId?: string | null;
  userId?: string | null;
  userRole?: string;
  onEvent?: (event: Record<string, unknown>) => void;
}

export async function fetchPipelineRuns(): Promise<PipelineRunsResponse> {
  return fetchWorkspace<PipelineRunsResponse>("/workspace/pipeline-runs");
}

export async function fetchPipelineRun(runId: string): Promise<PipelineRunDetail> {
  return fetchWorkspace<PipelineRunDetail>(`/pipeline/${runId}`);
}

export async function pollPipelineStatus(runId: string): Promise<PipelineRunDetail> {
  const res = await fetch(apiUrl(`/pipeline/status?run_id=${encodeURIComponent(runId)}`), {
    method: "POST",
    headers: { ...authHeaders() },
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new ApiError(res.status, detail.slice(0, 200));
  }
  return res.json() as Promise<PipelineRunDetail>;
}

/** Start pipeline via SSE; resolves when stream ends with run_id if available. */
export async function startPipeline(
  opts: PipelineStartOptions,
): Promise<{ runId: string | null; conversationId: string | null }> {
  const res = await fetch(apiUrl("/pipeline"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({
      message: opts.message,
      brand_id: opts.brandId ?? undefined,
      user_id: opts.userId ?? undefined,
      user_role: opts.userRole ?? "Owner",
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new ApiError(res.status, detail.slice(0, 200));
  }

  let runId: string | null = null;
  let conversationId: string | null = null;
  const reader = res.body?.getReader();
  if (!reader) return { runId, conversationId };

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const event = JSON.parse(line.slice(6)) as Record<string, unknown>;
        opts.onEvent?.(event);
        if (typeof event.run_id === "string") runId = event.run_id;
        if (typeof event.conversation_id === "string") conversationId = event.conversation_id;
      } catch {
        // skip malformed SSE chunks
      }
    }
  }

  return { runId, conversationId };
}

export type SwitchboardAgentId = "milo" | "sleyz" | "vea";

export interface SwitchboardAgentSummary {
  id: SwitchboardAgentId;
  name: string;
  role: string;
  status: string;
  metric: string;
}

export interface SwitchboardMessage {
  id: string;
  org_id: string;
  sender_slug: string;
  content: string;
  mentions?: string[];
  related_run_id?: string | null;
  hitl_draft_id?: string | null;
  created_at?: string;
}

export interface SwitchboardStep {
  id: string;
  agent_run_id: string;
  org_id: string;
  agent_slug: SwitchboardAgentId;
  step_label: string;
  step_status: "started" | "completed" | "failed" | string;
  detail?: string | null;
  created_at?: string;
}

export type SquadStreamEvent =
  | { type: "squad_message"; row: SwitchboardMessage }
  | { type: "agent_run_step"; row: SwitchboardStep }
  | { type: "error"; error: string };

export async function fetchSwitchboardAgents(): Promise<{
  agents: SwitchboardAgentSummary[];
}> {
  return fetchWorkspace("/agents");
}

export async function sendAgentMessage(
  agentId: SwitchboardAgentId,
  text: string,
): Promise<{
  run_id: string;
  agent_slug: SwitchboardAgentId;
  response: string;
  hitl_draft_id?: string | null;
  mentions?: string[];
}> {
  return postWorkspace(`/agent/${agentId}/message`, { text });
}

export async function fetchSquadMessages(): Promise<{
  messages: SwitchboardMessage[];
}> {
  return fetchWorkspace("/squad/messages");
}

export async function fetchSquadActivity(): Promise<{
  steps: SwitchboardStep[];
}> {
  return fetchWorkspace("/squad/activity");
}

export async function sendSquadMessage(
  text: string,
): Promise<{
  message: SwitchboardMessage;
  routed_to: SwitchboardAgentId[];
}> {
  return postWorkspace("/squad/message", { text });
}

export async function resolveHitlDraft(
  draftId: string,
  action: "approve" | "reject" | "edit",
  finalContent?: string,
): Promise<{ id: string; status: string; final_content?: string | null }> {
  return postWorkspace(`/hitl/${draftId}/${action}`, action === "edit" ? {
    final_content: finalContent ?? "",
  } : undefined);
}

export function createSquadEventSource(): EventSource {
  return new EventSource(apiUrl("/squad/stream"), {
    withCredentials: false,
  });
}

export function parseSquadStreamEvent(raw: string): SquadStreamEvent | null {
  try {
    return JSON.parse(raw) as SquadStreamEvent;
  } catch {
    return null;
  }
}
