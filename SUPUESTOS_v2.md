# Supuestos del modelo — PLANTASJ.fsm (planta Blender, L7 + L8)

Modelo: `PLANTASJ.fsm` (FlexSim 2026). Visual: `assets_v2/PATY_Planta_v5.glb` + `PATY_Techo_v3.glb`
(cargados por OnModelOpen con ruta relativa a la carpeta del .fsm). Objetos lógicos ocultos sobre cada máquina.

**Leyenda:** ✅ dato de planta/manual · 🔶 supuesto razonable · 🔴 supuesto grueso (calibrar).

## Unidades de carga
| Etapa | Unidad (flowitem) | Fuente |
|---|---|---|
| Camión → recepción → cámaras MP → mesada → picadora | 1 pallet MP (45 cajas blancas, 1,2 x 1,0 x 1,4 m) = 1 batch de 1500 kg | 🔶 (batch 1500 kg: dato usuario; "1 pallet = 1 batch" supuesto) |
| Mezcladora (Separator) | el **batch** de 1500 kg se divide en **10 cargas de 150 kg** (cada carga ≤ 181 kg, límite de izaje de los carros) | 🔶 tamaño de carga supuesto |
| Formadora (Separator) | cada carga de 150 kg se divide en **30 bandejas/cajas de 5 kg** (una cada 18,33 s, ritmo de la formadora) | ✅ 5,0 kg/caja (SUP 236213) |
| Formadora → túnel → envasado → encajonado → peso | 1 ítem = 1 caja de 5 kg | ✅ |
| Robot estibador (Combiner) | **144 cajas por pallet** | ✅ SUP 236213 |
| Cámaras PT → expedición | 1 pallet PT | — |

## Tiempos y capacidades
| # | Estación | Valor | Estado |
|---|---|---|---|
| T1 | Llegadas MP `SrcMP` empírica por hora desde `datos_trazabilidad/fitting_series/iat_cdf.csv` (49 pts) + `iat_empirica_hora.csv` (9h/10h/11h). Media global 2,62 min/mediana 1,03/CV 3,42; K-S rechaza exponencial (ET3 p.10-13: usar tabla `F⁻¹(u)`). Determinístico 16 pal/8h + 150 s solo para test ET4 p.17. Re-ajustar con 125k paginados, n=49 chico | 🔶 |
| T2 | Desencajado (mesada) | **3500 s por pallet** (se consume al ritmo de la línea; una caja cada 77,8 s), **2 operarios** | 🔴 |
| T3 | Picadora | 900 s por batch (≈6 t/h) | 🔴 |
| T4 | Mezcladora | 1200 s de mezcla por batch de 1500 kg | ✅ (20 min) |
| T5 | Formadora L3 por SKU (`cap_std_detalle.csv`): 69 g 1589,76 / 80 g 1843,2 kg/h por LÍNEA → 1/2 por FormL3A/B (795/922 kg/h, 48/56 golpes/min a 4 cav, ficha 25-90 ✅). R1 SKU por `mezcla_pesos_sku.csv`, cajas por `cajas_PT_pmf.csv` empírica (ET3 p.8-9 composición). Pallet E4 = 91×6,62 kg (602 kg), NO 144×5 kg (ese es SUP L7/L8). 18,33 s/caja = 982 kg/h es nominal formadora, NO tasa operario | ✅/🔶 |
| T6 | Túnel `Tunel3` como StraightConveyor `t=L/v` (ficha Advantec, L por módulos, v receta). Cap = L/paso calculada; validar WIP=λW (≈23 cajas a 1843 kg/h E4, W=5 min) vs cap 60. Downtime aparte: 147 min/17 ev/33d (MTBF 2795, MTTR 8,6) como breakdown, no como W | 🔶 |
| T7 | Detector de metales | **no modelado** (se quitó para liberar objetos de la licencia) | — |
| T8 | Envasadora | 4 s por caja (≈10 paquetes/caja a 150 paq/min) | 🔶 |
| T9 | Encajonadora | 5 s por caja | 🔶 |
| T10 | Control de peso | **no modelado** (se quitó para liberar objetos de la licencia) | — |
| T11 | Robot estibador | 60 s de cierre de pallet (film/etiqueta) tras 144 cajas (SUP L7/L8; E4 = 91 cajas, ver T5) | 🔶 |
| T12 | Paros por equipo-turno `turno_paros.csv` + `paros_eventos.csv`. MTTR empírica por (línea,equipo,turno TM/TT); fallback lognormal μ,σ de `ln(dur)`. MTBF = min operativos/eventos bajo SUPUESTO explícito 33d continuo 3T (47520 min/eventos). Ej L3 FOR 709 / EST 1828 / TUN 2795 min. Streams separados + semilla fija (ET4 p.19). Changeover 30-60 min sigue no modelado | 🔶 |

## Personal y recursos
| # | Supuesto | Estado |
|---|---|---|
| P1 | 2 operarios por mesada (pool `DispDesencajado` con 4 operarios) | 🔶 (coincide con Blender) |
| P2 | 1 operario por formadora | ✅ ficha formadora |
| P3 | 1 operario de envasado por línea (atiende A y B) | 🔶 |
| P4 | **4 montacargas**: Recep (camiones→almacén MP), AlmacenMP (almacén MP→desencajado), LineaPT (final de línea→almacén PT), Exped (almacén PT→expedición) | 🔶 |
| P5 | 3 turnos = operación continua 24 h, sin pausas ni cambios de formato | 🔶 (3 turnos ✅; pausas/changeover 30–60 min no modelados) |
| P6 | Operarios de recepción/expedición (documental, calidad) no modelados | 🔶 límite de 100 objetos |

## Ruteo
- Recepción reparte al azar entre cámaras MP congelado/enfriado; paletizado al azar entre PT congelado/enfriado.
- Detector → envasadoras y peso → robots: **primera disponible** (por eso las máquinas B casi no trabajan: con estos tiempos una sola alcanza).
- Racks PT: asignación "primer hueco" **sin exigir espacio físico** (el pallet con 144 cajas no entra en la altura de nivel por defecto).

## Simplificaciones técnicas (no son de proceso)
- Las cintas túnel→detector y rodillos peso→robot están en FlexSim (ocultas) sobre las de Blender; las cajas y hamburguesas estáticas de Blender no se exportan porque son dinámicas en FlexSim.
- Cola `QPaletizado_Lx` a la salida de cada celda de estibado: ahí el montacargas recoge el pallet terminado.
- Los objetos creados por script necesitan compilar su código: OnModelOpen recompila todos los nodos FlexScript al abrir.

## Resultado de referencia (24 h, semilla por defecto)
60 pallets MP recibidos · ~7.250 cajas/línea (≈36 t/línea) · 100 pallets PT expedidos.

## Visual y animación
- Pallet MP = ítem `PalletMP` (forma `pallet_mp.glb`); tras la mezcladora el ítem pasa a ser una bandeja de hamburguesas (`hamburguesa.glb`, 0,40 x 0,40 x 0,025 m = 5 kg) y tras la encajonadora una caja PATY (`caja_pt.glb`, escalada a 0,32 x 0,25 x 0,20 m para que 144 cajas den un pallet de ~2 m).
- Montacargas: 2,2 m/s cargado, 3 m/s vacío, 10 s de carga y 10 s de descarga por pallet.
- El archivo del visual lleva versión en el nombre (`PATY_Planta_v5.glb`): FlexSim recuerda las formas por archivo; al re-exportar usar un nombre nuevo.

## Desencajado
- El pallet de MP se deja junto a cada mesada (posición lógica `Desencajado_Lx` = lugar del pallet, x = -48,3) y se consume caja a caja durante los 1200 s del proceso: la forma del ítem pasa de 45 a 0 cajas (`pallet_mp_NN.glb`, una caja cada 26,7 s). Al terminar, el ítem sigue como batch de carne hacia la picadora.

## Etapas visuales de los ítems (todas dinámicas en FlexSim)
- Pallet MP (`pallet_mp`) → tras el desencajado, bloque de carne (`bloque_carne.glb`, 0,60 x 0,40 x 0,25 m) que viaja por el elevador mesada→picadora → tras la mezcladora, bandeja de hamburguesas (`hamburguesa.glb`) por las cintas de formadoras y túnel → tras la envasadora, paquete (`paquete.glb`) → tras la encajonadora, caja PATY (`caja_pt.glb`) por los rodillos → pallet de PT.
- Las cintas lógicas de FlexSim están ocultas y a 0,96 m (sobre la banda de Blender, que llega a 0,94 m): los ítems se ven sobre las bandas del modelo 3D. Si se bajan de 0,94 m los ítems quedan tapados por la banda.
- Montacargas: al terminar un traslado vuelven solos a su punto de espera (Recep: recepción; AlmacenMP: pasillo frente a la puerta del almacén MP enfriado; LineaPT: celda de estibado L7; Exped: playa de expedición).
- Límite de licencia: se alcanzó con las cintas de cajas post-encajonado (se quitaron); las cintas ElevadorMesada_Lx quedaron.

## Carne picada en cintas (AlimMez)
- Cintas ocultas `AlimMezA_L7`, `AlimMezB_L7`, `AlimMezA_L8`, `AlimMezB_L8` (0,15 m/s, suben 2,1 m como los elevadores de Blender) llevan el montículo de carne picada de la picadora a la mezcladora. Las 4 mezcladoras se alimentan por cinta.
- La picadora reparte entre mezcladoras eligiendo la menos cargada (cinta + mezcladora); con 'primera disponible' una cinta acumulaba batches y la otra mezcladora quedaba sin trabajo (−17 % de producción).
- Se quitaron 4 nodos de ruta (no hacía falta: el límite lo ocupaban 3 objetos de prueba `TMP_*` que quedaron creados; ya se borraron) de montacargas dentro de los almacenes (`NN_MPCong`, `NN_MPEnfr`, `NN_PTCong`, `NN_PTEnfr`) para hacer lugar.

## Ritmos y velocidades de cintas (para que se vea el flujo)
- Desencajado 3500 s por pallet: un poco más lento que la capacidad de las 2 mezcladoras de la línea (cada una tarda ≈6700 s entre mezclar y entregar las 300 bandejas), así cada batch encuentra una mezcladora libre y no espera parado al final de la cinta de carne picada (permanencia en la cinta = 22,8 s, solo el recorrido).
- Velocidades de cinta lógicas: formadoras 0,2 m/s, salida del túnel 0,15 m/s, rodillos 0,2 m/s, elevador mesada→picadora 0,1 m/s, cintas de carne picada 0,15 m/s. Más lentas que las reales, para ver varias bandejas/cajas seguidas; no cambian la producción.
- El cuello de botella es la formadora (18,33 s por caja de 5 kg, 982 kg/h): por eso hay una bandeja cada ~18 s por formadora.

## Terminología (corregida por el usuario)
- **Batch** = lo que genera la mezcladora (1500 kg); una vez generado se va dividiendo en **cargas** (10 de 150 kg) que alimentan a la formadora; cada carga da 30 unidades de 5 kg. Antes el modelo llamaba "lote" al batch y partía el batch directo en 300 bandejas; ahora pasa por la etapa de cargas.
- Ítem `carga_batch` = contenedor rojo con carne mezclada (0,60 x 0,40 x 0,36 m). Se ve solo un instante (la carga pasa de la mezcladora a la formadora sin cinta intermedia).
- Las formadoras son ahora Separator: cada una tarda 30 s en preparar la carga y entrega las 30 bandejas al ritmo de la cinta (la cinta deja entrar una cada 18,3 s: relleno de entrada 3,27 m a 0,2 m/s), equivalente a los 982 kg/h de la formadora.

## Estibado y licencia
- **1 robot estibador por línea** (`EstA_L7`, `EstA_L8`): se quitaron `EstB_L7/L8` (solo estibaban 233 cajas/día, 3 %); el robot A absorbe todo. Los robots B siguen en el modelo 3D de Blender como decoración.
- Cuenta de licencia: cuenta todo (incluidas las transferencias de cada cinta, 3 objetos por cinta) **excepto los nodos de ruta `NN_*`**. Tras esta purga: 97/100.

- `FlexsimModelFloor` (piso por defecto de FlexSim, 1x1 m, tapado por el modelo de Blender) se eliminó: licencia 96/100.
- Probado y descartado: partir cada pallet en 45 bloques (Separator) y juntarlos de nuevo en la picadora con un Combiner en modo *join*; en FlexSim 2026 ese modo no junta N ítems (trata cada bloque por separado, 900 s c/u) y el flujo se trababa. Se volvió a 1 bloque por batch.

## Dashboard web (dashboard/)
- Nodos `Tools/Publicar`, `Tools/ArrancaPublicador`, `Tools/OnOpenDashboard`, `pubLast`, `pubRun` (no cuentan para la licencia): publican cada 60 s simulados estado, contenido, entradas/salidas de 32 objetos, posición de los 4 montacargas y KPI (pallets MP/PT, cajas por línea) por HTTP a `localhost:3000/api/ingest`. Ver `dashboard/README.md`.
- Se repusieron `NN_MPEnfr`, `NN_MPCong`, `NN_PTCong`, `NN_PTEnfr` (rutas de montacargas dentro de los almacenes; no cuentan para la licencia).

## Visual v9 y pallets en montacargas
- `assets_v2/PATY_Planta_v9.glb` (generado con `make_planta_v6.py` desde v5): colores vivos, pasto verde sobre isla de bordes redondeados y vegetación como geometría. Conserva los camiones estáticos de los muelles y quita los robots estibadores B (queda solo `EstA` en cada línea: 2 en total). OnModelOpen carga v9. Cuesta 0 objetos (un solo visual).
- **Pallets en los montacargas:** los 4 montacargas tenían el contenido oculto (`hidecontents`); ahora se muestra (lo fija `Tools/OnOpenDashboard`). El pallet se dibuja delante del vehículo, sobre las horquillas.
- Se probó un camión animado (objeto `CamionMP`) y se descartó: no aporta al análisis. Licencia de nuevo en **96/100**.
- Producción de referencia sin cambios: 16 pallets PT a las 6 h, 190 en 48 h.

## V&V L3 (ET4 p.17-19)
- V: determinístico (T1=const, S2=const) cálculo a mano; traza 1 entidad; conservación por turno `SrcMP.out = SinkEXP.in + WIP`; extremos λ=0, MTBF=∞/0; revisión cruzada.
- V: 1 día simulado (3T, semilla fija, ≥10 réplicas streams separados) vs tablero: 36,0 pal/día L3 ±IC95% y 1843 kg/h std como techo (no media). Desvío >15% → recalibrar S1-S4/T5 antes de escenarios.

## Fallas aleatorias y réplicas (E1)
- Módulo `Tools/Fallas` + relay `Tools/ArrancaFallas` (código en `dashboard/flexsim/fallas.fls` y `arranca_fallas.fls`; no consumen objetos de licencia: siguen 96/100). Se registra en `Tools/OnOpenDashboard` y arranca solo una vez por corrida (OnExit de `SrcCamionesMP`).
- Tiempo a la falla **exponencial** y reparación **lognormal** (σ = 0,9, media = MTTR) por equipo. MTBF y MTTR del tablero Sep–Oct (línea 3, MTBF bajo supuesto de 3 turnos continuos 33 d = 47520 min): formadoras 709,3 / 6,15 min, túneles 2795,3 / 8,65, envasadoras 4752 / 5,0, estibadores 1827,7 / 13,0; picadoras con el dato de planta (880 / 11,3, la línea 3 tiene un solo evento). Se aplican a los 14 equipos de L7 y L8 (formadoras A y B, túneles, envasadoras A y B, estibadores A, picadoras).
- Las máquinas paradas pasan a estado "en falla" (se ve en la web). `Tools/fallOn = 0` apaga las fallas; `Tools/repId` elige la réplica (streams 60–87, desplazados `12·repId` números).
- Las fallas bajan la producción menos de 1 % por día (los acumuladores las absorben): referencia nueva de 24 h = 89,4 ± 0,6 pallets en la planta (antes 90 sin fallas). Ver `datos_trazabilidad/e1_final/E1_FINAL.md`.
- El publicador al dashboard usa el puerto de `Tools/pubPort` (3000 por defecto); `Tools/pubOff = 1` lo apaga para correr réplicas.
- Escenarios: `Tools/mttrK` (factor sobre el MTTR de formadoras y túneles, 1 = base) para E3; E2 se corre cambiando `entrySpacePadding` de `CintaFormA/B_Lx` (3,27 → 1,554 m) y se restaura a 3,27. Resultados en `datos_trazabilidad/e1_final/E1_FINAL.md`.
- E4 se corre por script y se restaura: `splitquantity` de las mezcladoras (10 → 8 cargas), `cycletime` de desencajado y picadora (×0,8), cantidades del calendario de `SrcCamionesMP` (20 pallets por turno) y `setuptime` de las mezcladoras como lavado por batch (0/15/30 min, **supuesto sin dato**). El modelo base queda con lavado 0, 10 cargas y 16 pallets por turno.
- Pallet real: 700–900 kg y unas 40 cajas (dato del usuario); el modelo arma pallets de 144 bandejas de 5 kg = 720 kg, dentro de ese rango. La comparación con el tablero se hace en pallets y en toneladas.
- Dato del usuario: las líneas 7 y 8 trabajan por igual. La diferencia 25,8 contra 39,1 pallets/día del tablero no se explica por la planta; se compara contra las dos líneas juntas (64,9 pallets, 56,0 t/día). Hipótesis abierta: con 30 min de lavado por batch el modelo da 55,7 t/día (−0,5 % contra el real); falta confirmar si existe ese lavado.
