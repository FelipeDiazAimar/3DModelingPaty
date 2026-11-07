import { useSyncExternalStore } from "react";

/** El recorrido a pie necesita teclado y mouse: no se ofrece en teléfonos ni pantallas táctiles. */
export function usePuedeCaminar() {
  return useSyncExternalStore(
    (cb) => {
      const a = window.matchMedia("(min-width: 768px)"), b = window.matchMedia("(pointer: coarse)");
      a.addEventListener("change", cb); b.addEventListener("change", cb);
      return () => { a.removeEventListener("change", cb); b.removeEventListener("change", cb); };
    },
    () => window.matchMedia("(min-width: 768px)").matches && !window.matchMedia("(pointer: coarse)").matches,
    () => false,
  );
}
