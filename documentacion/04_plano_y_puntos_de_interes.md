# Puntos de interés (menú "Ir a")

Ideas tomadas de Shapespark (recorridos arquitectónicos en el navegador). Solo en el modo a pie (escritorio con
teclado y mouse; no se ofrece en teléfonos ni pantallas táctiles). La vista de plano se quitó.

## Menú "Ir a" (vertical, a la derecha, minimizable)

- Las 8 etapas de una línea (desencajado → estibado), numeradas del 1 al 8. Se viaja **con el botón o con la tecla
  1–8**; los botones L7/L8 del menú cambian de línea.
- El operario viaja en un arco de ~1 s (pasa por encima de lo que haya en el medio).
- Busca un lugar libre a 1,6 m de un costado de la máquina (prueba los cuatro con rayos de colisión) y lo deja
  mirándola, con su ficha abierta.

## Otros controles

- **C**: alterna 1ª / 3ª persona (única forma de cambiarla).
- **Q** saluda, **B** baila.
- El panel de controles y el menú "Ir a" se minimizan con la flecha; el minimapa tiene zoom (+ / −).

Código: `components/Walk.tsx` (`frenteDe`, `irA`, `puntosDeInteres`, `IrA`, `dibujarMapa`).
