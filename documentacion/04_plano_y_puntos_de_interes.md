# Vista de plano y puntos de interés

Ideas tomadas de Shapespark (recorridos arquitectónicos en el navegador). Solo en el modo a pie.

## Vista de plano (tecla M o botón "Plano")

- Cámara desde arriba con el norte hacia arriba, centrada donde está el operario.
- WASD desplaza el plano y la rueda del mouse hace zoom (de 25 a 900 m de altura).
- **Clic en el piso:** el operario viaja hasta ahí en un arco de ~1 s (pasa por encima de lo que haya en el medio).
- **Clic en una máquina o en su pin:** se para frente a ella, mirándola, con su ficha abierta.
- En el plano se ven todos los pines; caminando, solo el de lo elegido.

## Puntos de interés (barra "Ir a", abajo)

- Las 8 etapas de una línea (desencajado → estibado). El botón L7/L8 cambia de línea.
- Busca un lugar libre a 1,6 m de un costado de la máquina (prueba los cuatro con rayos de colisión) y deja al
  operario mirándola.

Código: `components/Walk.tsx` (`frenteDe`, `irA`, `abrirPlano`, `puntosDeInteres`).
