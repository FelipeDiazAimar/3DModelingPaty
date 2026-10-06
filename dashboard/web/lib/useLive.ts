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
    const arrivals: { w: number; e: number }[] = []; // (reloj de pared, tiempo simulado) de cada llegada
    const flush = () => {
      if (!buf.length) return;
      const e = buf[buf.length - 1].t, w = performance.now();
      st().addMany(buf.splice(0));
      arrivals.push({ w, e });
      while (arrivals.length > 1 && w - arrivals[0].w > 9000) arrivals.shift();
    };
    const flushId = setInterval(flush, 250);
    let es: EventSource | null = null;
    let stop = false;
    let demoId: ReturnType<typeof setInterval> | undefined;

    let demoT = 0, demoSample = 0;
    if (demo) {
      st().setConnected(true);
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
    let rate = 0; // s simulados por s real, medido sobre las llegadas
    const loop = (now: number) => {
      const dt = Math.min(0.25, (now - prev) / 1000);
      prev = now;
      const { history, playT, playing, speed, setPlayT } = st();
      if (demo && !(playT !== null && !playing)) { // el demo avanza a la velocidad elegida y en pausa se frena
        demoT += speed * dt;
        while (demoSample + 10 <= demoT) { demoSample += 10; buf.push(demoSnapshot(demoSample)); }
      }
      const end = history[history.length - 1]?.t ?? 0;
      if (playT === null) {
        clock.live = true;
        const first = history[0]?.t ?? 0;
        if (demo) clock.t = demoT; // el demo ya es continuo
        else {
          // ritmo de llegada medido en una ventana larga (los datos llegan a saltos de 10 s simulados)
          const old = arrivals.find((a) => now - a.w < 8000);
          if (old && now - old.w > 1500) rate = Math.max(0, (end - old.e) / ((now - old.w) / 1000));
          else if (!old) rate = 0;
          const target = Math.max(first, end - 10);
          if (clock.t > end || Math.abs(target - clock.t) > 600) clock.t = Math.max(first, Math.min(end, target));
          else clock.t += (rate + (target - clock.t) * 0.12) * dt; // corrección muy suave
          clock.t = Math.max(first, Math.min(end, clock.t));
        }
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
