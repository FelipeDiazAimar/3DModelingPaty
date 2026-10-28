# Análisis en 3D

## Operarios de FlexSim

- Los 4 operarios del modelo (`OpDesencajado_L7/L8`, `OpEnvasado_L7/L8`; posiciones de
  `manifests_v2/logicos_v2.json`, en `lib/layout.ts → OPERARIOS`) se dibujan con el modelo del operario.
- Trabajan (`Interact`) mientras su máquina procesa, caminan cuando se mueven y si no esperan.
- Si el publicador manda su posición (campo `fleet`), la siguen interpolada; si no, quedan en su puesto.
  Hoy quedan en su puesto: el `publicador.fls` del repo ya los incluye, pero falta cargarlo en `PLANTASJ.fsm`
  (ver [FlexSim](07_flexsim_mcp.md)).

## Mapa de calor ("Opciones de vista")

- Pinta el piso de cada máquina de L7/L8 según su utilización acumulada (`lib/derive.ts → utilization`, fracción
  de muestras en "procesando"): verde = libre, rojo = saturada. Se recalcula cada 1,5 s. Se ve también en el plano.

## Seguir un lote (cinemática)

- Recorre las 8 etapas de la línea (L8 si está elegida arriba; si no, L7).
- En cada etapa: el tiempo medio de una unidad ahí por la **ley de Little**, W = L / λ, con L el contenido medio
  y λ la tasa de llegadas, ambos después del calentamiento de 2,5 h (`lib/derive.ts → timeAverages`,
  `lambdaArrivals`; `lib/cine.ts → tiempoEnEtapa`), y el acumulado desde el desencajado.
- Antes del calentamiento avisa que no hay datos suficientes.

## Comparar con E1 en 3D ("Opciones de vista" → E2 / E3 / E4)

- Ilumina las máquinas que cambian en el escenario: formadoras (E2), formadoras y túneles (E3), desencajado,
  picadora y mezcladoras (E4).
- Tarjeta 3D con los resultados de `public/e1/escenarios.json` y `e4.json`: pallets/día de E1 y del escenario con
  su IC 95 %, la diferencia y un veredicto.
- El veredicto usa si los IC se solapan, que es más estricto que la prueba pareada de la página Escenarios; cuando
  se solapan, la tarjeta remite a esa página. E4 trae una sola cifra por variante (sin IC): muestra la diferencia
  sin veredicto.
