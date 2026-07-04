import { NextRequest, NextResponse } from "next/server";

const API_BASE =
  (process.env.CONVERZA_API_URL || process.env.NEXT_PUBLIC_CONVERZA_API_URL || "http://127.0.0.1:8001").replace(
    /\/$/,
    "",
  );

async function proxyGet(request: NextRequest, path: string) {
  const auth = request.headers.get("authorization");
  const res = await fetch(`${API_BASE}${path}`, {
    headers: auth ? { Authorization: auth } : {},
    cache: "no-store",
  });
  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" },
  });
}

async function proxyPost(request: NextRequest, path: string) {
  const auth = request.headers.get("authorization");
  const payload = await request.text();
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(auth ? { Authorization: auth } : {}),
    },
    body: payload || undefined,
  });
  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxyGet(request, `/api/${path.join("/")}`);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxyPost(request, `/api/${path.join("/")}`);
}
