import { state } from "@/lib/serverState";
export const dynamic = "force-dynamic";

/** Historial completo; si es muy largo se diezma (siempre incluye la última muestra). */
export async function GET() {
  const h = state.history;
  const max = 6000;
  const step = Math.max(1, Math.ceil(h.length / max));
  const out = step === 1 ? h : h.filter((_, i) => i % step === 0 || i === h.length - 1);
  return Response.json({ history: out, lastIngest: state.lastIngest, total: h.length });
}
