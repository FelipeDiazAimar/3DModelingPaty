"use client";
import { useEffect, useRef, useState } from "react";
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

/** Elegir un escenario para ver su cuello de botella sobre la planta (cuello + etapas más afectadas + resultados). */
function EscenarioPicker() {
  const esc = useStore((s) => s.escenario);
  const set = useStore((s) => s.setEscenario);
  const lavado = useStore((s) => s.lavado);
  const setLavado = useStore((s) => s.setLavado);
  return (
    <div className="px-2 py-1.5">
      <div className="text-[12.5px] font-extrabold leading-tight">Cuello de botella por escenario</div>
      <div className="mt-1.5 flex gap-1" role="group" aria-label="Escenario">
        {(["E1", "E2", "E3", "E4"] as const).map((e) => (
          <button key={e} onClick={() => set(esc === e ? null : e)} aria-pressed={esc === e}
            className={`flex-1 rounded-full px-2.5 py-1 text-[12px] font-bold transition ${esc === e ? "bg-brand text-white" : "bg-[#eef3fa] hover:opacity-80"}`}>
            {e}
          </button>
        ))}
      </div>
      {esc === "E4" && (
        <div className="mt-1.5 flex items-center gap-1" role="group" aria-label="Lavado por batch">
          <span className="mr-0.5 text-[11px] text-muted">Lavado</span>
          {([0, 15, 30] as const).map((l) => (
            <button key={l} onClick={() => setLavado(l)} aria-pressed={lavado === l}
              className={`flex-1 rounded-full px-2 py-0.5 text-[11.5px] font-bold transition ${lavado === l ? "bg-ink text-white" : "bg-[#eef3fa] hover:opacity-80"}`}>
              {l === 0 ? "0" : `${l} min`}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Botón redondo con engranaje (arriba a la derecha) que abre los ajustes de la vista 3D. `completo`: también mapa de calor y escenarios. */
function useAjustes() {
  const st = {
    rend: useStore((s) => s.rend), setRend: useStore((s) => s.setRend),
    luz: useStore((s) => s.luz), setLuz: useStore((s) => s.setLuz),
    calor: useStore((s) => s.calor), setCalor: useStore((s) => s.setCalor),
    escenario: useStore((s) => s.escenario),
  };
  // las preferencias guardadas se aplican aunque el panel esté cerrado
  useEffect(() => {
    const s = useStore.getState();
    const leer = (k: string) => { try { return localStorage.getItem(`paty.${k}`) === "1"; } catch { return false; } };
    if (leer("rend")) s.setRend(true);
    if (leer("luz")) s.setLuz(true);
    if (leer("calor")) s.setCalor(true);
  }, []);
  return st;
}

function ListaAjustes({ completo }: { completo: boolean }) {
  const st = useAjustes();
  return (
    <>
      <Interruptor on={st.rend} set={st.setRend} clave="rend" titulo="Modo rendimiento" sub="Más fluido en PCs lentas" />
      <Interruptor on={st.luz} set={st.setLuz} clave="luz" titulo="Iluminación realista" sub="Sombras horneadas en Blender" />
      {completo && <Interruptor on={st.calor} set={st.setCalor} clave="calor" titulo="Mapa de calor" sub="Utilización: verde libre · rojo saturada" />}
      {completo && <EscenarioPicker />}
    </>
  );
}

/** Los mismos ajustes, desplegados en línea (menú del teléfono). */
export function AjustesEnLinea() {
  return (
    <div>
      <div className="mb-1 text-[12px] font-semibold text-muted">Ajustes de vista</div>
      <div className="flex flex-col"><ListaAjustes completo /></div>
    </div>
  );
}

export function OpcionesVista({ completo }: { completo: boolean }) {
  const st = useAjustes();
  const [abierto, setAbierto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  // se cierra al tocar afuera o con Esc
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: PointerEvent) => { if (!raiz.current?.contains(e.target as Node)) setAbierto(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setAbierto(false); };
    document.addEventListener("pointerdown", fuera);
    window.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", fuera); window.removeEventListener("keydown", esc); };
  }, [abierto]);
  const activas = [st.rend, st.luz, completo && st.calor, completo && !!st.escenario].filter(Boolean).length;
  return (
    <div ref={raiz} className="pointer-events-auto relative hidden md:block">
      <button onClick={() => setAbierto(!abierto)} aria-expanded={abierto} aria-label="Ajustes de rendimiento y vista" title="Ajustes de rendimiento y vista"
        className="glass relative grid h-[42px] w-[42px] place-items-center !rounded-full hover:bg-white">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
        {activas > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] font-bold leading-none text-white">{activas}</span>}
      </button>
      {abierto && (
        <div className="glass absolute right-0 top-[50px] z-50 flex w-[260px] flex-col p-1.5">
          <ListaAjustes completo={completo} />
        </div>
      )}
    </div>
  );
}
