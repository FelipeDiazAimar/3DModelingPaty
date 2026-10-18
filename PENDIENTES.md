# Pendientes del gemelo digital (PLANTASJ.fsm, L7 + L8)

Estado al 18/10/2026. Todo lo hecho está en `main`; el modelo base guardado tiene 96/100 objetos, lavado 0, 10 cargas por batch y 16 pallets de materia prima por turno.

## 1. Cerrar la brecha de validación (lo más importante)
**Situación.** E1 (10 réplicas de 24 h, `datos_trazabilidad/e1_final/E1_FINAL.md`): planta 89,4 ± 0,6 pallets/día contra 64,9 del tablero (+37,8 %); en toneladas 65,5 contra 56,0 (+17 %). El real queda fuera del IC.

**Dato confirmado por el usuario.** Las líneas 7 y 8 trabajan por igual. Entonces la diferencia 25,8 contra 39,1 pallets/día del tablero no la explica la planta; se compara contra las dos líneas juntas.

**Hipótesis abierta (no calibrada).** El modelo solo para por fallas (menos de 1 % de la producción). La planta real tiene además lavados y cambios de formato. Con un lavado supuesto de 30 min por batch, el modelo da 55,7 t/día contra 56,0 del tablero (−0,5 %); con 15 min da 62,4 (+11 %). Los 30 min son un supuesto sin dato.

**Información que falta (preguntar en planta):**
1. ¿Hay lavado o cambio de formato por batch en la mezcladora? ¿De cuánto tiempo?
2. ¿Cuántos días y turnos produce cada línea en el período del tablero? (el promedio puede incluir días sin producir)
3. ¿Cuántas formadoras trabajan realmente en cada línea (A y B, o una sola)?
4. ¿Cómo asigna el tablero los pallets a cada línea? Con líneas iguales, 25,8 contra 39,1 no cierra.
5. Paros propios de la L7 y la L8 por separado (el tablero tiene línea 3 y total de planta).
6. Producción por día de cada línea (fecha, turnos, pallets o kilos): con eso se ve si el promedio sale de días parados o de menor ritmo.

**Qué hacer según la respuesta:**
- Si existe un lavado por batch: dejarlo fijo en el modelo (`setuptime` de `MezA/B_Lx`, ver `SUPUESTOS_v2.md`) y volver a correr E1 y los escenarios (script de las réplicas abajo).
- Si no existe: el +17 % en toneladas es la brecha real; buscar otra causa (tiempos de la formadora, paradas no registradas, turnos).

## 2. Decisiones de modelado abiertas
- **Tamaño del pallet.** El modelo arma pallets de 144 bandejas de 5 kg = 720 kg. El usuario indica que el real pesa 700–900 kg con unas 40 cajas (el tablero promedia 862,5 kg). Se dejó 720 kg (dentro del rango) y se compara en pallets y en toneladas. Si se cambia, hacerlo con una fuente del producto.
- **Variación en el modelo.** Hoy es determinista salvo las fallas: llegadas de materia prima fijas (16 pallets cada 8 h) y tiempos de máquina constantes. El informe pide llegadas empíricas por hora y ruido en los tiempos; con eso las réplicas tendrían más variación.
- **Cuello de botella.** Con las formadoras a 1843 kg/h (E2) la producción sube solo 2,8 %: el techo pasa a la materia prima (72 t/día). Conciliar 982 contra 1843 kg/h (nominal de la formadora contra estándar de línea) sigue sin resolverse.

## 3. Resultados de escenarios (todos con las mismas 10 réplicas)
| Escenario | Resultado |
|---|---|
| E1 base | 89,4 ± 0,6 pallets/día, no valida en pallets |
| E2 formadoras a 1843 kg/h | +2,5 pallets/día (+2,8 %), techo en materia prima |
| E3 MTTR ×1,25 en formadoras y túneles | sin efecto (IC incluye el cero) |
| E4 batch 1200 contra 1500 kg | con lavado, 1500 kg rinde 3,8 % (15 min) a 5,7 % (30 min) más; sin lavado casi igual |

## 4. Cómo repetir las corridas
Las réplicas se corren dentro de FlexSim con el MCP (modelo `PLANTASJ.fsm` abierto y `mcp_start();` ejecutado):
1. Apagar el publicador: `Tools/pubOff = 1`. Fallas encendidas: `Tools/fallOn = 1`. Factor E3: `Tools/mttrK` (1 = base).
2. Por cada réplica `k` de 1 a 10: `Tools/repId = k`, `resetmodel()`, correr a 86400 s y leer pallets (entrada de `QPaletizado_L7/L8`), cajas (salidas de `EncA/EncB`) y `Tools/fallLog`.
3. Los streams de FlexSim van de 0 a 99: se usan 60–87 y cada réplica salta `12·k` números (`Tools/ArrancaFallas`). La misma réplica con el mismo `repId` reproduce exactamente los mismos resultados (ya verificado).
4. Al terminar restaurar: `pubOff = 0`, `fallLast = 1e9`, `pubLast = 1e9`, `repId = 1`, `mttrK = 1`, y guardar.
5. Procesar con `datos_trazabilidad/e1_final/analizar_e1.py`, `analizar_escenarios.py` y `analizar_e4.py` (generan los JSON de `dashboard/web/public/e1/`).

**Parámetros de los escenarios (se cambian por script y se restauran):**
- E2: `entrySpacePadding` de `CintaFormA/B_L7/L8`, 3,27 → 1,554 m.
- E4 (1200 kg): `splitquantity` de las mezcladoras 10 → 8, `cycletime` de desencajado 3500 → 2800 s y de picadora 900 → 720 s, calendario de `SrcCamionesMP` con 20 pallets por turno (filas 4, 8, 12 y 16 con cantidad 2), y `setuptime` de las mezcladoras como lavado (0, 900 o 1800 s).

## 5. Cosas técnicas a tener presentes
- **Puerto.** El publicador de FlexSim usa el puerto de `Tools/pubPort` (3000 por defecto). Si el 3000 está ocupado: `npm run dev -- -p 3010` y `model().find("Tools/pubPort").value = 3010;`.
- **Conexión del MCP.** Al abrir el modelo, FlexSim se conecta solo. Si otro servidor MCP quedó escuchando en el 8765 (por ejemplo uno de opencode), FlexSim se conecta a ese: cerrar el sobrante y volver a ejecutar `mcp_start();` en la consola Script.
- **Primera corrida tras cambiar la configuración.** Una vez, la primera corrida tras restaurar el modelo dio 4 cajas de diferencia en la línea 8 (6606 en vez de 6602); al repetirla coincidió con la original. Causa no identificada; no afecta los resultados de los escenarios.
- **Web.** No se pudieron ver en pantalla las páginas Paradas, Estadística y Escenarios (la extensión de Chrome estaba desconectada); compilan y el build de producción pasa. Revisar la maquetación (tablas anchas y textos largos) abriendo `npm run dev`.
- **Datos de la planta.** Los JSON crudos de `datos_trazabilidad/` no se suben al repositorio (ver `.gitignore`); los resultados agregados sí.
