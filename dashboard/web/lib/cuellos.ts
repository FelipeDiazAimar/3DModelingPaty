"use client";
import { useEffect, useState } from "react";

/** Resultados de public/e1/cuellos.json (los genera datos_trazabilidad/e1_final/analizar_cuellos.py). */
export interface EtapaFila {
  id: string; puntaje: number;
  ocup_base?: number; ocup?: number; d_ocup?: number;
  cont_base?: number; cont?: number; stay_base?: number; stay?: number; d_stay?: number;
  cap_base?: number | null; cap?: number | null;
  cola_base?: number | null; cola?: number | null;
  rack_base?: number; rack?: number; rack_max?: number; d_rack?: number;
}
export interface MaqFila { ocup: number; proc: number; block: number; d_ocup: number; cont: number; cont_base: number; stay: number; stay_base: number }
export interface Textos { titulo: string; cuello: string; efectos: { etapa: string; txt: string }[]; conclusion: string }
export interface Paquete {
  base: string;
  cuello: { etapa: string; cap_t: number; siguiente: string; cap_siguiente: number };
  cuello_base: { etapa: string; cap_t: number };
  afectadas: string[];
  etapas: EtapaFila[];
  maquinas: Record<string, MaqFila>;
  rack: { base: number; esc: number; max: number };
  cola_mez: { base: number; esc: number };
  texto: Textos;
  contexto_lavado?: Paquete | null;
}
export interface CuellosData { replicas: Record<string, number>; escenarios: Record<string, Paquete> }

export type Esc = "E1" | "E2" | "E3" | "E4";
export type Lavado = 0 | 15 | 30;
export const claveEsc = (e: Esc, lavado: Lavado) => (e === "E4" ? `E4_L${lavado}` : e);

export const NOMBRE_ETAPA: Record<string, string> = {
  desencajado: "Desencajado", picado: "Picado", mezclado: "Mezclado", formado: "Formado", tunel: "Túnel de frío",
  envasado: "Envasado", encajonado: "Encajonado", estibado: "Estibado", camara_mp: "Cámaras de MP",
};
/** Etapas con ocupación medible, en el orden del flujo. */
export const ETAPAS_FLUJO = ["desencajado", "picado", "mezclado", "formado", "envasado", "encajonado"] as const;
export const MAQ_ETAPA: Record<string, string[]> = {
  desencajado: ["Desencajado_L7", "Desencajado_L8"], picado: ["Picadora_L7", "Picadora_L8"],
  mezclado: ["MezA_L7", "MezB_L7", "MezA_L8", "MezB_L8"], formado: ["FormA_L7", "FormB_L7", "FormA_L8", "FormB_L8"],
  tunel: ["Tunel_L7", "Tunel_L8"], envasado: ["EnvA_L7", "EnvB_L7", "EnvA_L8", "EnvB_L8"],
  encajonado: ["EncA_L7", "EncB_L7", "EncA_L8", "EncB_L8"], estibado: ["EstA_L7", "EstA_L8"],
  camara_mp: ["RackMPCongelado", "RackMPEnfriado"],
};
export const COLOR_CUELLO = "#d5334b";
export const COLOR_AFECTADA = "#e08a1e";

let cache: CuellosData | null = null;
export function useCuellos(activo = true): CuellosData | null {
  const [d, setD] = useState<CuellosData | null>(cache);
  useEffect(() => {
    if (!activo || cache) return;
    fetch("/e1/cuellos.json").then((r) => r.json()).then((j: CuellosData) => { cache = j; setD(j); })
      .catch((err) => console.warn("Sin resultados de cuellos de botella:", err));
  }, [activo]);
  return d;
}
