"use client";
import { useStore } from "@/lib/store";
import { simClock } from "./Shell";

const SPEEDS: [number, string, string][] = [
  [10, "×10", "10 s simulados por segundo"],
  [60, "×60", "1 minuto simulado por segundo"],
  [300, "×300", "5 minutos simulados por segundo"],
  [1200, "×1200", "20 minutos simulados por segundo"],
  [3600, "×3600", "1 hora simulada por segundo"],
];

const Ico = {
  play: <path d="M8 5.5v13l11-6.5z" />,
  pause: <path d="M7 5h4v14H7zM13 5h4v14h-4z" />,
  back: <path d="M6 5h2.5v14H6zM20 5.5v13L9.5 12z" />,
};
function Icon({ k }: { k: keyof typeof Ico }) {
  return <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>{Ico[k]}</svg>;
}

export function Player() {
  const history = useStore((s) => s.history);
  const playT = useStore((s) => s.playT);
  const playing = useStore((s) => s.playing);
  const speed = useStore((s) => s.speed);
  const { setPlayT, setPlaying, setSpeed } = useStore.getState();
  if (!history.length) return null;
  const first = history[0].t, end = history[history.length - 1].t;
  const live = playT === null;
  const t = live ? end : playT;
  const running = live || playing;

  const toggle = () => {
    if (live) { setPlayT(end); setPlaying(false); }
    else if (playing) setPlaying(false);
    else { if (playT >= end - 1) setPlayT(first); setPlaying(true); }
  };

  return (
    <div className="glass pointer-events-auto flex w-full max-w-[880px] flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-[24px] px-3 py-2.5 md:w-auto md:flex-nowrap md:rounded-[28px] md:px-4" role="group" aria-label="Reproductor de la simulación">
      <button onClick={() => { setPlayT(first); setPlaying(true); }} aria-label="Volver al inicio" className="grid h-9 w-9 place-items-center rounded-full bg-[#e8eef7] text-ink transition hover:bg-[#d9e3f1]"><Icon k="back" /></button>
      <button onClick={toggle} aria-label={running ? "Pausar" : "Reproducir"} className="grid h-11 w-11 place-items-center rounded-full bg-brand text-white shadow-[0_6px_16px_-4px_rgba(217,41,59,.6)] transition hover:scale-105 active:scale-95">
        <Icon k={running ? "pause" : "play"} />
      </button>
      <div className="order-last flex w-full min-w-0 flex-col gap-0.5 md:order-none md:w-auto md:min-w-[320px] md:flex-1">
        <input
          type="range" min={first} max={Math.max(end, first + 1)} step={10} value={t}
          onChange={(e) => setPlayT(Number(e.target.value))}
          aria-label="Línea de tiempo" className="player-range w-full"
          style={{ ["--p" as string]: `${end > first ? ((t - first) / (end - first)) * 100 : 100}%` }}
        />
        <div className="tnum flex justify-between text-[11px] font-semibold text-muted"><span>{simClock(t)}</span><span>{simClock(end)}</span></div>
      </div>
      <button onClick={() => { const i = SPEEDS.findIndex(([v]) => v === speed); setSpeed(SPEEDS[(i + 1) % SPEEDS.length][0]); }} aria-label="Cambiar velocidad" className="tnum rounded-full bg-[#e8eef7] px-3.5 py-2 text-[12px] font-extrabold md:hidden">{SPEEDS.find(([v]) => v === speed)?.[1]}</button>
      <div className="hidden items-center rounded-full bg-[#e8eef7] p-0.5 md:flex" role="group" aria-label="Velocidad">
        {SPEEDS.map(([v, label, tip]) => (
          <button key={v} title={tip} onClick={() => setSpeed(v)} aria-pressed={speed === v}
            className={`tnum rounded-full px-2 py-1.5 text-[11px] font-bold transition md:px-2.5 md:text-[12px] ${speed === v ? "bg-white text-ink shadow" : "text-muted hover:text-ink"}`}>{label}</button>
        ))}
      </div>
      <button onClick={() => { setPlayT(null); setPlaying(true); }} disabled={live}
        className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-[12px] font-bold transition ${live ? "bg-[#dff5ee] text-[#0e7a5f]" : "bg-ink text-white hover:opacity-90"}`}>
        <span className={`h-2 w-2 rounded-full ${live ? "live-dot bg-[var(--ok)]" : "bg-white/70"}`} />{live ? "En vivo" : "Ir al vivo"}
      </button>
    </div>
  );
}
