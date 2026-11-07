"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon, type IconName } from "./Icons";
import { CINES, useCine } from "@/lib/cine";
import { useStore } from "@/lib/store";

export const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Planta 3D", icon: "cube" },
  { href: "/produccion", label: "Producción", icon: "factory" },
  { href: "/paradas", label: "Paradas", icon: "pause" },
  { href: "/colas", label: "Colas y WIP", icon: "layers" },
  { href: "/velocidad", label: "Velocidad", icon: "gauge" },
  { href: "/masa", label: "Balance de masa", icon: "scale" },
  { href: "/flota", label: "Montacargas", icon: "forklift" },
  { href: "/estadistica", label: "Estadística", icon: "chart" },
  { href: "/escenarios", label: "Escenarios", icon: "flask" },
];

/** Selector de sección propio (reemplaza al <select> del navegador). */
export function NavMenu() {
  const path = usePathname();
  const [openAt, setOpenAt] = useState<string | null>(null); // path con el menú abierto: navegar lo cierra
  const open = openAt === path;
  const setOpen = (v: boolean | ((o: boolean) => boolean)) => setOpenAt((c) => ((typeof v === "function" ? v(c === path) : v) ? path : null));
  const [idxRaw, setIdx] = useState<{ path: string; i: number } | null>(null);
  const idx = idxRaw?.path === path ? idxRaw.i : Math.max(0, NAV.findIndex((n) => n.href === path));
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpenAt(null); };
    window.addEventListener("pointerdown", away);
    return () => window.removeEventListener("pointerdown", away);
  }, [open, path]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false);
    else if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setIdx({ path, i: (idx + 1) % NAV.length }); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setOpen(true); setIdx({ path, i: (idx - 1 + NAV.length) % NAV.length }); }
    else if (e.key === "Enter" && open) { e.preventDefault(); (root.current?.querySelectorAll<HTMLAnchorElement>("a")[idx])?.click(); }
  };

  return (
    <div ref={root} className="relative" onKeyDown={onKey}>
      <button onClick={() => setOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={open}
        className="glass flex items-center gap-2.5 py-2 pl-2.5 pr-3.5 text-[14px] font-bold transition hover:bg-white">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-ink text-white"><Icon name="chart" size={17} /></span>
        Estadísticas
        <svg viewBox="0 0 20 20" width="16" height="16" className={`text-muted transition ${open ? "rotate-180" : ""}`} aria-hidden><path d="M5 7.5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      {open && (
        <div role="listbox" className="menu-pop glass absolute left-0 top-[calc(100%+8px)] z-50 w-[250px] p-2">
          {NAV.map((n, i) => (
            <Link key={n.href} href={n.href} role="option" aria-selected={n.href === path} onMouseEnter={() => setIdx({ path, i })}
              className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[14px] font-semibold transition ${n.href === path ? "bg-ink text-white" : i === idx ? "bg-[#e8eef8]" : ""}`}>
              <span className={`grid h-8 w-8 place-items-center rounded-xl ${n.href === path ? "bg-white/15" : "bg-[#eaf0fa] text-brand"}`}><Icon name={n.icon} size={17} /></span>
              {n.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/** Selector de cinemáticas (junto al de Estadísticas): el nombre es fijo; la que está en marcha se marca y se corta tocándola. */
export function CineMenu() {
  const path = usePathname();
  const router = useRouter();
  const id = useCine((s) => s.id);
  const play = useCine((s) => s.play);
  const stop = useCine((s) => s.stop);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("pointerdown", away);
    window.addEventListener("keydown", esc);
    return () => { window.removeEventListener("pointerdown", away); window.removeEventListener("keydown", esc); };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={open}
        className={`glass flex items-center gap-2.5 py-2 pl-2.5 pr-3.5 text-[14px] font-bold transition hover:bg-white ${id ? "ring-2 ring-brand" : ""}`}>
        <span className={`grid h-8 w-8 place-items-center rounded-xl ${id ? "bg-brand" : "bg-ink"} text-white`}><Icon name={id ? "pause" : "play"} size={17} /></span>
        Cinemáticas
        <svg viewBox="0 0 20 20" width="16" height="16" className={`text-muted transition ${open ? "rotate-180" : ""}`} aria-hidden><path d="M5 7.5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      {open && (
        <div role="listbox" className="menu-pop glass absolute left-0 top-[calc(100%+8px)] z-50 w-[290px] p-2">
          {CINES.map((c) => {
            const on = id === c.id;
            return (
              <button key={c.id} role="option" aria-selected={on} onClick={() => {
                setOpen(false);
                if (on) stop();
                else { if (path !== "/") router.push("/"); play(c.id, useStore.getState().history); }
              }} className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition ${on ? "bg-brand text-white" : "hover:bg-[#e8eef8]"}`}>
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${on ? "bg-white/15" : "bg-[#eaf0fa] text-brand"}`}><Icon name={on ? "pause" : c.icon} size={17} /></span>
                <span className="leading-tight">
                  <span className="block text-[14px] font-semibold">{c.label}</span>
                  <span className={`block text-[11px] ${on ? "text-white/80" : "text-muted"}`}>{on ? "Tocá para detener" : c.sub}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
