# Pendientes del gemelo digital (PLANTASJ.fsm, L7 + L8)

Estado al 18/10/2026. Todo lo hecho está en `main`; el modelo base guardado tiene 96/100 objetos, lavado 0, 10 cargas por batch y 16 pallets de materia prima por turno.

## 1. Validación (cerrada en toneladas)
**Situación.** Con el lavado de 30 min por batch (dato confirmado el 7/11/2026, ya incluido en el modelo base) E1 da 75,3 pallets/día y **54,9 t/día contra 56,0 del tablero (−1,9 %)** (10 réplicas, `datos_trazabilidad/e1_final/E1_FINAL.md`). El real queda apenas fuera del IC (muy angosto, ≈ 0,5 t de semiancho). En pallets la diferencia (+16 %) es por el tamaño del pallet del modelo (720 kg contra 862,5 kg reales).

**Dato confirmado por el usuario.** Las líneas 7 y 8 trabajan por igual: la diferencia 25,8 contra 39,1 pallets/día del tablero no la explica la planta y se compara contra las dos líneas juntas.

**Información que sigue faltando (preguntar en planta):**
1. ¿Cuántos días y turnos produce cada línea en el período del tablero? (el promedio puede incluir días sin producir)
2. ¿Cuántas formadoras trabajan realmente en cada línea?
3. ¿Cómo asigna el tablero los pallets a cada línea?
4. Paros propios de la L7 y la L8 por separado.
5. Producción por día de cada línea.
6. Tiempo real de desencajado por pallet (3500 s es el supuesto que hoy fija el techo de la planta).

## 2. Decisiones de modelado abiertas
- **Tamaño del pallet.** El modelo arma pallets de 144 bandejas de 5 kg = 720 kg. El usuario indica que el real pesa 700–900 kg con unas 40 cajas (el tablero promedia 862,5 kg). Se dejó 720 kg (dentro del rango) y se compara en pallets y en toneladas. Si se cambia, hacerlo con una fuente del producto.
- **Variación en el modelo.** Hoy es determinista salvo las fallas: llegadas de materia prima fijas (16 pallets cada 8 h) y tiempos de máquina constantes. El informe pide llegadas empíricas por hora y ruido en los tiempos; con eso las réplicas tendrían más variación.
- **Cuello de botella.** Con lavado de 30 min el cuello de E1 son las mezcladoras (65,3 t/día); después de E2 pasa al desencajado (74,1 t/día, 3500 s por pallet y línea). Conciliar 982 contra 1843 kg/h (nominal contra estándar de línea) sigue sin resolverse, y el tiempo real de desencajado es lo que más conviene medir.

## 3. Resultados de escenarios (todos con las mismas 10 réplicas)
| Escenario | Resultado |
|---|---|
| E1 base (lavado 30 min) | 75,3 ± 0,7 pallets/día, 54,9 t/día: valida en toneladas (−1,9 %). El cuello son las mezcladoras (65 t/día) |
| E2 formadoras a 1843 kg/h | +14,4 pallets/día (+19 %): libera las mezcladoras y el cuello pasa al desencajado (74 t/día) |
| E3 más MP (24 pallets/turno) + E2 | 89,6 pallets/día, igual que E2 (−0,1 contra E2): el desencajado es el techo y la MP se acumula en cámaras (6 → 22 pallets) |
| E5 MTTR ×1,25 en formadoras y túneles (antes E3) | sin efecto; medido con el modelo anterior, sin lavado |
| E4 batch 1200 contra 1500 kg (lavado 30 min, 10 réplicas) | 1500 kg rinde 4,0 pallets/día más (−5,3 % para 1200); con 15 min 2,4; sin lavado 1200 kg gana 1,8 por latencia |

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
