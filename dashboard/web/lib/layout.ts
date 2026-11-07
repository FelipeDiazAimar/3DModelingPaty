import raw from "./layout.json";
import type { FleetItem, LayoutItem } from "./types";

export const MACHINES = raw.machines as LayoutItem[];
export const FLEET = raw.fleet as FleetItem[];
/** Operarios de FlexSim (manifests_v2/logicos_v2.json, clase Operator) y la máquina que atiende cada uno. */
export const OPERARIOS = [
  { id: "OpDesencajado_L7", label: "Operario desencajado L7", x: -44, y: 9.4, maq: "Desencajado_L7" },
  { id: "OpDesencajado_L8", label: "Operario desencajado L8", x: -44, y: -17.4, maq: "Desencajado_L8" },
  { id: "OpEnvasado_L7", label: "Operario envasado L7", x: 9.8, y: 9.15, maq: "EnvA_L7" },
  { id: "OpEnvasado_L8", label: "Operario envasado L8", x: 9.8, y: -17.15, maq: "EnvA_L8" },
];
export const byId = (id: string) => MACHINES.find((m) => m.id === id);
export const STAGES = ["desencajado", "picado", "mezclado", "formado", "tunel", "envasado", "encajonado", "estibado"] as const;
export const STAGE_LABEL: Record<string, string> = {
  desencajado: "Desencajado", picado: "Picado", mezclado: "Mezclado", formado: "Formado",
  tunel: "Túnel", envasado: "Envasado", encajonado: "Encajonado", estibado: "Estibado", logistica: "Logística",
};
export const STATE_LABEL: Record<string, string> = {
  proc: "Procesando", idle: "Inactiva", blocked: "Bloqueada", starved: "Sin material", down: "En falla",
};
export const STATE_COLOR: Record<string, string> = {
  proc: "#16a37f", idle: "#8b97a8", blocked: "#e08a1e", starved: "#d6a21a", down: "#d5334b",
};
// Meta del informe (tablero Sep–Oct): 36 pallets/día por línea, 1,5 pal/h
export const META_PAL_DIA_LINEA = 36;
