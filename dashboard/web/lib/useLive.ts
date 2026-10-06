"use client";
import { useEffect } from "react";
import { clock, useStore } from "./store";
import { demoSnapshot } from "./demo";
import type { Snapshot } from "./types";

/** Conecta con el puente (SSE), agrupa las muestras cada 250 ms y mueve el reloj de reproducción. */
export function useLive() {
  const demo = useStore((s) => s.demo);
  useEffect(() => {
    const st = useStore.getState;
    const buf: Snapshot[] = [];
    let lastIn = 0; // reloj de pared de la última llegada de datos
    const flush = () => { if (buf.length) { lastIn = performance.now(); st().addMany(buf.splice(0)); } };
    const flushId = setInterval(flush, 250);
    let es: EventSource | null = null;
    let stop = false;
    let demoId: ReturnType<typeof setInterval> | undefined;

    if (demo) {
      let t = 0;
      st().setConnected(true);
      demoId = setInterval(() => { const q = st(); if (q.playT !== null && !q.playing) return; for (let k = 0; k < 6; k++) { t += 10; buf.push(demoSnapshot(t)); } }, 250); // en pausa el demo no sigue generando: la barra no se corre
    } else {
      const connect = async () => {
        try {
          const j = await (await fetch("/api/state", { cache: "no-store" })).json();
          st().setHistory(j.history as Snapshot[]);
        } catch {}
        es = new EventSource("/api/stream");
        es.onopen = () => st().setConnected(true);
        es.onmessage = (e) => buf.push(JSON.parse(e.data) as Snapshot);
        es.onerror = () => { st().setConnected(false); es?.close(); if (!stop) setTimeout(connect, 2000); };
      };
      connect();
    }

    // reloj: avanza el cabezal y avisa a React ~5 veces por segundo
    let raf = 0, prev = performance.now(), lastPush = 0;
    const loop = (now: number) => {
      const dt = Math.min(0.25, (now - prev) / 1000);
      prev = now;
      const { history, playT, playing, speed, setPlayT } = st();
      const end = history[history.length - 1]?.t ?? 0;
      if (playT === null) {
        // en vivo: el cabezal persigue la última muestra (una atrás mientras llegan datos) para que el movimiento sea continuo
        clock.live = true;
        const first = history[0]?.t ?? 0;
        const target = now - lastIn < 1500 ? Math.max(first, end - 10) : end;
        if (clock.t > end) clock.t = end;
        clock.t += (target - clock.t) * (1 - Math.exp(-dt / 0.35));
        if (Math.abs(target - clock.t) < 0.01) clock.t = target;
      }
      else {
        clock.live = false;
        let t = playT;
        if (playing) {
          t = Math.min(end, playT + dt * speed);
          clock.t = t;
          if (t >= end) { setPlayT(null); }
          else if (now - lastPush > 200) { lastPush = now; setPlayT(t); }
        } else clock.t = playT;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => { stop = true; es?.close(); clearInterval(flushId); if (demoId) clearInterval(demoId); cancelAnimationFrame(raf); };
  }, [demo]);
}
