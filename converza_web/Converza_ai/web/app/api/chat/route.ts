import { NextRequest } from "next/server";

const API_BASE =
  (process.env.CONVERZA_API_URL || process.env.NEXT_PUBLIC_CONVERZA_API_URL || "http://127.0.0.1:8001").replace(
    /\/$/,
    "",
  );

function sseHeaders() {
  return {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  };
}

function errorStream(message: string): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`));
      controller.close();
    },
  });
  return new Response(stream, { headers: sseHeaders() });
}

/**
 * Master Feed chat — proxies to Converza FastAPI /chat (Groq/Hermes).
 * @Milo / @Sleyz / @Vea routing is applied server-side in main.py.
 */
export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (!auth) {
    return errorStream("Sign in with Telegram first (landing → Sign in).");
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return errorStream("Invalid request body.");
  }

  const upstream = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: auth,
      "X-Converza-Lang": request.headers.get("x-converza-lang") || "en",
    },
    body: JSON.stringify({
      message: body.message,
      user_role: body.user_role ?? "Owner",
      conversation_history: body.conversation_history ?? [],
      client_context: body.client_context ?? {},
      brand_id: body.brand_id ?? null,
    }),
  });

  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => upstream.statusText);
    let detail = errText.slice(0, 300);
    try {
      const parsed = JSON.parse(errText);
      detail = parsed.detail || detail;
    } catch {
      // keep raw
    }
    return errorStream(detail || `Backend error ${upstream.status}`);
  }

  if (!upstream.body) {
    return errorStream("No response stream from Co-Pilot backend.");
  }

  return new Response(upstream.body, { headers: sseHeaders() });
}
