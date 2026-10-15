"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon, type IconName } from "./Icons";

export const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Planta 3D", icon: "cube" },
  { href: "/produccion", label: "Producción", icon: "factory" },
  { href: "/paradas", label: "Paradas", icon: "pause" },
  { href: "/colas", label: "Colas y WIP", icon: "layers" },
  { href: "/velocidad", label: "Velocidad", icon: "gauge" },
  { href: "/masa", label: "Balance de masa", icon: "scale" },
  { href: "/flota", label: "Montacargas", icon: "forklift" },
  { href: "/estadistica", label: "Métricas", icon: "chart" },
  { href: "/escenarios", label: "Escenarios", icon: "flask" },
];

/** Selector de sección propio (reemplaza al <select> del navegador). */
export function NavMenu() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const cur = NAV.find((n) => n.href === path) ?? NAV[0];

  useEffect(() => {
    if (!open) return;
    setIdx(Math.max(0, NAV.findIndex((n) => n.href === path)));
    const away = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    window.addEventListener("pointerdown", away);
    return () => window.removeEventListener("pointerdown", away);
  }, [open, path]);
  useEffect(() => setOpen(false), [path]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false);
    else if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setIdx((i) => (i + 1) % NAV.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setOpen(true); setIdx((i) => (i - 1 + NAV.length) % NAV.length); }
    else if (e.key === "Enter" && open) { e.preventDefault(); (root.current?.querySelectorAll<HTMLAnchorElement>("a")[idx])?.click(); }
  };

  return (
    <div ref={root} className="relative" onKeyDown={onKey}>
      <button onClick={() => setOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={open}
        className="glass flex items-center gap-2.5 py-2 pl-2.5 pr-3.5 text-[14px] font-bold transition hover:bg-white">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-ink text-white"><Icon name={cur.icon} size={17} /></span>
        {cur.label}
        <svg viewBox="0 0 20 20" width="16" height="16" className={`text-muted transition ${open ? "rotate-180" : ""}`} aria-hidden><path d="M5 7.5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      {open && (
        <div role="listbox" className="menu-pop glass absolute left-0 top-[calc(100%+8px)] z-50 w-[250px] p-2">
          {NAV.map((n, i) => (
            <Link key={n.href} href={n.href} role="option" aria-selected={n.href === path} onMouseEnter={() => setIdx(i)}
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
