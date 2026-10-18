// format.ts — solo render es-AR, nunca cálculo.
// Cálculo siempre con punto; UI siempre con coma (ET6: 4,8 min; 78 %; 0,302).
export function formatES(v: number, dec = 1): string {
  if (!Number.isFinite(v)) return "—";
  return v.toLocaleString("es-AR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}
export const fmtInt = (v: number): string => Math.round(v).toLocaleString("es-AR");
export const fmtPct = (v: number, dec = 0): string => `${formatES(v, dec)} %`;
export const axisFmt =
  (dec = 1) =>
  (val: number): string =>
    formatES(Number(val), dec);
