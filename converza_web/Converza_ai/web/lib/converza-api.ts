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
