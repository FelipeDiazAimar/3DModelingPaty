"use client";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";

/** Interruptor de la vista 3D; su valor se guarda en este navegador (clave `paty.<clave>`, la restaura OpcionesVista). */
function Interruptor({ on, set, clave, titulo, sub }: { on: boolean; set: (b: boolean) => void; clave: string; titulo: string; sub: string }) {
  const cambiar = () => {
    set(!on);
    try { localStorage.setItem(`paty.${clave}`, on ? "0" : "1"); } catch { /* sin almacenamiento: vale para esta visita */ }
  };
  return (
    <button role="switch" aria-checked={on} onClick={cambiar} className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition hover:bg-[#eef3fa]">
      <span className={`relative h-5 w-9 shrink-0 rounded-full transition ${on ? "bg-brand" : "bg-[#cfd8e6]"}`} aria-hidden>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${on ? "left-[18px]" : "left-0.5"}`} />
      </span>
      <span>
        <span className="block text-[12.5px] font-extrabold leading-tight">{titulo}</span>
        <span className="block text-[11px] leading-tight text-muted">{sub}</span>
      </span>
    </button>
  );
}

/** Elegir un escenario para verlo contra E1 sobre la planta (máquinas que cambian + resultados). */
function EscenarioPicker() {
  const esc = useStore((s) => s.escenario);
  const set = useStore((s) => s.setEscenario);
  return (
    <div className="px-2 py-1.5">
      <div className="text-[12.5px] font-extrabold leading-tight">Comparar con E1 en 3D</div>
      <div className="mt-1.5 flex gap-1" role="group" aria-label="Escenario">
        {(["E2", "E3", "E4"] as const).map((e) => (
          <button key={e} onClick={() => set(esc === e ? null : e)} aria-pressed={esc === e}
            className={`flex-1 rounded-full px-2.5 py-1 text-[12px] font-bold transition ${esc === e ? "bg-brand text-white" : "bg-[#eef3fa] hover:opacity-80"}`}>
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Desplegable con los interruptores de la vista 3D (cerrado ocupa una línea). `completo`: también mapa de calor y escenarios. */
export function OpcionesVista({ completo }: { completo: boolean }) {
  const st = {
    rend: useStore((s) => s.rend), setRend: useStore((s) => s.setRend),
    luz: useStore((s) => s.luz), setLuz: useStore((s) => s.setLuz),
    calor: useStore((s) => s.calor), setCalor: useStore((s) => s.setCalor),
    escenario: useStore((s) => s.escenario),
  };
  const [abierto, setAbierto] = useState(false);
  // las preferencias guardadas se aplican aunque el desplegable esté cerrado
  useEffect(() => {
    const s = useStore.getState();
    const leer = (k: string) => { try { return localStorage.getItem(`paty.${k}`) === "1"; } catch { return false; } };
    if (leer("rend")) s.setRend(true);
    if (leer("luz")) s.setLuz(true);
    if (leer("calor")) s.setCalor(true);
  }, []);
  const activas = [st.rend, st.luz, st.calor, !!st.escenario].filter(Boolean).length;
  return (
    <div className="glass pointer-events-auto hidden md:block">
      <button onClick={() => setAbierto(!abierto)} aria-expanded={abierto} className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left">
        <span className="text-[12.5px] font-extrabold">Opciones de vista{activas ? <span className="ml-1.5 rounded-full bg-brand px-1.5 py-0.5 text-[10.5px] text-white">{activas}</span> : null}</span>
        <span className="text-[11px] text-muted" aria-hidden>{abierto ? "▲" : "▼"}</span>
      </button>
      {abierto && (
        <div className="flex flex-col pb-1.5 pl-1 pr-1">
          <Interruptor on={st.rend} set={st.setRend} clave="rend" titulo="Modo rendimiento" sub="Más fluido en PCs lentas" />
          <Interruptor on={st.luz} set={st.setLuz} clave="luz" titulo="Iluminación realista" sub="Sombras horneadas en Blender" />
          {completo && <Interruptor on={st.calor} set={st.setCalor} clave="calor" titulo="Mapa de calor" sub="Utilización: verde libre · rojo saturada" />}
          {completo && <EscenarioPicker />}
        </div>
      )}
    </div>
  );
}
