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
      let t = 0, lastSample = 0;
      st().setConnected(true);
      // el demo avanza a la velocidad elegida en el reproductor; en pausa no genera (la barra no se corre)
      demoId = setInterval(() => {
        const q = st();
        if (q.playT !== null && !q.playing) return;
        t += q.speed * 0.1;
        while (lastSample + 10 <= t) { lastSample += 10; buf.push(demoSnapshot(lastSample)); }
      }, 100);
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
    let rate = 0, rateE0 = 0, rateW0 = performance.now(); // ritmo de llegada de datos (s simulados / s real)
    const loop = (now: number) => {
      const dt = Math.min(0.25, (now - prev) / 1000);
      prev = now;
      const { history, playT, playing, speed, setPlayT } = st();
      const end = history[history.length - 1]?.t ?? 0;
      if (playT === null) {
        // en vivo: el cabezal avanza al mismo ritmo en que llegan los datos (medido), una muestra y media atrás,
        // y se corrige despacio hacia ese objetivo: movimiento parejo en vez de saltos
        clock.live = true;
        const first = history[0]?.t ?? 0;
        if (now - rateW0 > 400) {
          const r = Math.max(0, (end - rateE0) / ((now - rateW0) / 1000));
          rate += (r - rate) * 0.4;
          rateE0 = end; rateW0 = now;
        }
        const target = Math.max(first, end - 15);
        if (clock.t > end || clock.t < first - 1) clock.t = Math.max(first, Math.min(end, clock.t));
        if (Math.abs(target - clock.t) > 600) clock.t = target; // salto grande (corrida nueva o recarga)
        else clock.t += (rate + (target - clock.t) * 0.7) * dt;
        clock.t = Math.max(first, Math.min(end, clock.t));
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
