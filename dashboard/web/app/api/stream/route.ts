import { state } from "@/lib/serverState";
import type { Snapshot } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const enc = new TextEncoder();
  let cleanup = () => {};
  const stream = new ReadableStream({
    start(c) {
      const send = (s: Snapshot) => {
        try { c.enqueue(enc.encode(`data: ${JSON.stringify(s)}\n\n`)); } catch {}
      };
      state.listeners.add(send);
      const ping = setInterval(() => { try { c.enqueue(enc.encode(": ping\n\n")); } catch {} }, 15000);
      cleanup = () => { state.listeners.delete(send); clearInterval(ping); };
      req.signal.addEventListener("abort", cleanup);
      c.enqueue(enc.encode(": ok\n\n"));
    },
    cancel() { cleanup(); },
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" },
  });
}
