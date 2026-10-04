"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useLive } from "@/lib/useLive";
import { useLatest, useStore } from "@/lib/store";
import { Player } from "./Player";
import { NAV, NavMenu } from "./NavMenu";
import { KpiChips } from "./Console";

export function simClock(t: number) {
  const d = Math.floor(t / 86400), h = Math.floor((t % 86400) / 3600), m = Math.floor((t % 3600) / 60);
  return `Día ${d + 1} · ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Barra de progreso fina al cambiar de sección. */
function RouteBar() {
  const path = usePathname();
  const [on, setOn] = useState(false);
  useEffect(() => {
    setOn(true);
    const id = setTimeout(() => setOn(false), 650);
    return () => clearTimeout(id);
  }, [path]);
  return <div aria-hidden className={`route-bar ${on ? "route-bar-on" : ""}`} />;
}

export function Shell({ children }: { children: React.ReactNode }) {
  useLive();
  const path = usePathname();
  const connected = useStore((s) => s.connected);
  const demo = useStore((s) => s.demo);
  const line = useStore((s) => s.line);
  const { setDemo, setLine } = useStore.getState();
  const last = useLatest();
  const waiting = !last;
  const home = path === "/";
  return (
    <div className="relative flex h-dvh flex-col overflow-hidden">
      <RouteBar />
      <div className={home ? "pointer-events-none absolute inset-x-0 top-0 z-30" : "z-30"}>
      <header className={`flex flex-wrap items-center gap-2 px-3 py-2 md:gap-3 md:px-4 md:py-3 ${home ? "[&>*]:pointer-events-auto" : ""}`}>
        <Link href="/" className="flex shrink-0 items-center gap-2.5 pr-1">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-brand text-base md:h-10 md:w-10 font-extrabold text-white shadow-[0_8px_18px_-6px_rgba(217,41,59,.7)]">P</span>
          <span className="hidden whitespace-nowrap leading-tight sm:block">
            <span className="block text-[15px] font-extrabold tracking-tight">PATY San Jorge</span>
            <span className="block text-[11px] font-medium text-muted">Gemelo digital</span>
          </span>
        </Link>
        <nav className="glass hidden min-w-0 items-center gap-0.5 overflow-x-auto p-1 min-[1800px]:flex" aria-label="Secciones">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="nav-link" aria-current={path === n.href ? "page" : undefined}>{n.label}</Link>
          ))}
        </nav>
        <div className="min-[1800px]:hidden"><NavMenu /></div>
        {home && <div className="order-last -mx-3 w-[calc(100%+1.5rem)] overflow-x-auto px-3 pb-1 [scrollbar-width:none] min-[1440px]:order-none min-[1440px]:mx-0 min-[1440px]:w-auto min-[1440px]:overflow-visible min-[1440px]:p-0"><KpiChips /></div>}
        <div className="ml-auto flex min-w-0 shrink-0 items-center gap-1.5 md:gap-2">
          <div className="glass hidden p-1 sm:flex" role="group" aria-label="Línea">
            {(["Todas", "L7", "L8"] as const).map((l) => (
              <button key={l} onClick={() => setLine(l)} className="nav-link" aria-current={line === l ? "page" : undefined}>{l === "Todas" ? "Planta" : `L${l.slice(1)}`}</button>
            ))}
          </div>
          <div className="glass flex items-center gap-2 whitespace-nowrap px-3.5 py-2.5 text-[13px] font-bold">
            <span className={`live-dot h-2.5 w-2.5 rounded-full ${connected && !waiting ? "bg-[var(--ok)]" : "bg-[var(--warn)]"}`} />
            <span className="hidden sm:inline">{demo ? "DEMO" : connected && !waiting ? "Conectado" : "Esperando FlexSim"}</span>
            <span className="tnum hidden font-semibold text-muted md:inline">{last ? simClock(last.t) : ""}</span>
          </div>
          <button onClick={() => setDemo(!demo)} className="glass whitespace-nowrap px-3 py-2.5 text-[13px] font-bold hover:bg-white md:px-3.5">
            {demo ? "Salir del demo" : "Demo"}
          </button>
        </div>
      </header>
      </div>
      <main className={home ? "absolute inset-0" : "relative min-h-0 flex-1"}>
        {children}
        <div className={`pointer-events-none absolute inset-x-0 bottom-2 z-40 flex px-2 md:bottom-3 md:px-4 ${path === "/" ? "justify-center md:justify-end" : "justify-center"}`}><Player /></div>
      </main>
    </div>
  );
}
