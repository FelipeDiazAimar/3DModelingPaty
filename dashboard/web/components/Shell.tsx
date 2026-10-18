"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useLive } from "@/lib/useLive";
import { useLatest, useStore } from "@/lib/store";
import { Player } from "./Player";
import { NAV, NavMenu } from "./NavMenu";
import { KpiChips } from "./Console";
import { Icon } from "./Icons";

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

function LineSelector({ className = "" }: { className?: string }) {
  const line = useStore((s) => s.line);
  const setLine = useStore((s) => s.setLine);
  return (
    <div className={`glass p-1 ${className}`} role="group" aria-label="Línea">
      {(["Todas", "L7", "L8"] as const).map((l) => (
        <button key={l} onClick={() => setLine(l)} className="nav-link" aria-current={line === l ? "page" : undefined}>{l === "Todas" ? "Planta" : `L${l.slice(1)}`}</button>
      ))}
    </div>
  );
}

/** Menú de teléfono: botón hamburguesa y panel lateral a la derecha. "Demo" va al final del panel. */
function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const path = usePathname();
  const demo = useStore((s) => s.demo);
  const setDemo = useStore((s) => s.setDemo);
  useEffect(() => { onClose(); }, [path]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);
  return (
    <div className={`fixed inset-0 z-[60] md:hidden ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div onClick={onClose} className={`absolute inset-0 bg-[#0f1b2d]/40 backdrop-blur-[2px] transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`} />
      <aside role="dialog" aria-label="Menú" className={`absolute inset-y-0 right-0 flex w-[84vw] max-w-[320px] flex-col bg-white p-4 shadow-[-20px_0_50px_-20px_rgba(15,27,45,.45)] transition-transform duration-250 ${open ? "translate-x-0" : "translate-x-full"}`} style={{ borderRadius: "28px 0 0 28px" }}>
        <div className="mb-3 flex items-center justify-between">
          <span className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand text-base font-extrabold text-white shadow-[0_8px_18px_-6px_rgba(217,41,59,.7)]">P</span>
            <span className="leading-tight">
              <span className="block text-[15px] font-extrabold tracking-tight">PATY San Jorge</span>
              <span className="block text-[11px] font-medium text-muted">Gemelo digital</span>
            </span>
          </span>
          <button onClick={onClose} aria-label="Cerrar menú" className="grid h-9 w-9 place-items-center rounded-full bg-[#eaf0fa] text-lg font-bold">×</button>
        </div>
        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto" aria-label="Secciones">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[15px] font-semibold ${n.href === path ? "bg-ink text-white" : "hover:bg-[#eef3fb]"}`}>
              <span className={`grid h-9 w-9 place-items-center rounded-xl ${n.href === path ? "bg-white/15" : "bg-[#eaf0fa] text-brand"}`}><Icon name={n.icon} size={18} /></span>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="mt-3 space-y-3 border-t border-[var(--line)] pt-3">
          <div>
            <div className="mb-1.5 text-[12px] font-semibold text-muted">Mostrar</div>
            <LineSelector className="flex !shadow-none bg-[#eef3fb]" />
          </div>
          <button onClick={() => { setDemo(!demo); onClose(); }} className="w-full rounded-2xl bg-ink px-4 py-3 text-[14px] font-bold text-white">
            {demo ? "Salir del demo" : "Ver demo"}
          </button>
        </div>
      </aside>
    </div>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  useLive();
  const path = usePathname();
  const connected = useStore((s) => s.connected);
  const demo = useStore((s) => s.demo);
  const setDemo = useStore((s) => s.setDemo);
  const last = useLatest();
  const [menu, setMenu] = useState(false);
  const waiting = !last;
  const home = path === "/";
  const ok = connected && !waiting;
  const statusText = demo ? "DEMO" : ok ? "Conectado" : "Esperando FlexSim";
  return (
    <div className="relative flex h-dvh flex-col overflow-hidden">
      <RouteBar />
      <MobileMenu open={menu} onClose={() => setMenu(false)} />
      <div className={home ? "pointer-events-none absolute inset-x-0 top-0 z-30" : "z-30"}>
        <header className={`flex items-start gap-2 px-3 py-2 md:items-center md:gap-3 md:px-4 md:py-3 ${home ? "flex-wrap [&>*]:pointer-events-auto" : ""}`}>
          <Link href="/" className={`shrink-0 items-center gap-2.5 pr-1 ${home ? "hidden md:flex" : "flex"}`}>
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-brand text-base font-extrabold text-white shadow-[0_8px_18px_-6px_rgba(217,41,59,.7)] md:h-10 md:w-10">P</span>
            <span className="hidden whitespace-nowrap leading-tight md:block">
              <span className="block text-[15px] font-extrabold tracking-tight">PATY San Jorge</span>
              <span className="block text-[11px] font-medium text-muted">Gemelo digital</span>
            </span>
          </Link>
          {home && <div style={{ pointerEvents: "none" }} className="order-2 flex min-w-0 basis-full justify-center md:hidden"><KpiChips compact /></div>}
          {/* escritorio */}
          <nav className="glass hidden min-w-0 items-center gap-0.5 overflow-x-auto p-1 min-[1800px]:flex" aria-label="Secciones">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="nav-link" aria-current={path === n.href ? "page" : undefined}>{n.label}</Link>
            ))}
          </nav>
          <div className="hidden md:block min-[1800px]:hidden"><NavMenu /></div>
          {home && <div style={{ pointerEvents: "none" }} className="order-last hidden min-w-0 basis-full justify-center md:flex min-[1800px]:hidden"><KpiChips compact /></div>}
          {home && <div className="hidden min-w-0 min-[1800px]:block"><KpiChips /></div>}
          <div className={`ml-auto hidden items-center gap-2 md:flex ${home ? "order-1 min-[1800px]:order-none" : ""}`}>
            <LineSelector className="flex" />
            <div className="glass flex items-center gap-2 whitespace-nowrap px-3.5 py-2.5 text-[13px] font-bold">
              <span className={`live-dot h-2.5 w-2.5 rounded-full ${ok ? "bg-[var(--ok)]" : "bg-[var(--warn)]"}`} />
              {statusText}
              <span className="tnum font-semibold text-muted">{last ? simClock(last.t) : ""}</span>
            </div>
            <button onClick={() => setDemo(!demo)} className="glass whitespace-nowrap px-3.5 py-2.5 text-[13px] font-bold hover:bg-white">{demo ? "Salir del demo" : "Demo"}</button>
          </div>
          {/* teléfono: estado a la izquierda de la hamburguesa, ambos a la derecha */}
          <div className={`ml-auto flex shrink-0 items-center gap-2 md:hidden ${home ? "order-1" : ""}`}>
            <div className="glass flex h-10 items-center gap-1.5 whitespace-nowrap px-3 text-[11px] font-bold" title={statusText} aria-label={statusText}>
              <span className={`live-dot h-2.5 w-2.5 rounded-full ${ok ? "bg-[var(--ok)]" : "bg-[var(--warn)]"}`} />
              {demo && "DEMO"}
            </div>
            <button onClick={() => setMenu(true)} aria-label="Abrir menú" aria-expanded={menu} className="glass grid h-10 w-10 place-items-center">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            </button>
          </div>
        </header>
      </div>
      <main className={home ? "absolute inset-0" : "relative min-h-0 flex-1"}>
        {children}
        <div className={`pointer-events-none absolute inset-x-0 bottom-2 z-40 flex px-2 md:bottom-3 md:px-4 ${home ? "justify-center md:justify-end" : "justify-center"}`}><Player /></div>
      </main>
    </div>
  );
}
