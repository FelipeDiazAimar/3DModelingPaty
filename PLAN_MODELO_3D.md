# Plan: modelo 3D de la planta completa (Ciclo 1, Ciclo 2 y Elaborados)

Estado al 23/10/2026. Objetivo: pasar del modelo actual (solo la nave de Elaborados con las líneas 7 y 8) a la planta San Jorge entera, **sin mover nada de lo que FlexSim usa**.

## 1. Regla que no se rompe: las conexiones con FlexSim

FlexSim dibuja la planta como **un solo objeto visual** (`assets_v2/PATY_Planta_v9.glb`, licencia 96/100 objetos) y pone sus objetos lógicos invisibles encima de las máquinas de Blender. Las posiciones están en `manifests_v2/logicos_v2.json` (metros, Z arriba, coordenadas de mundo de Blender):

- 32 objetos fijos (desencajado, picadoras, mezcladoras A/B, formadoras A/B, túneles, envasadoras, encajonadoras, estibadores de L7 y L8; racks MP/PT; recepción y expedición),
- 8 cintas (formado, túnel, etc. de L7 y L8),
- 8 móviles (montacargas, operarios).

Extensión actual: x −85,25 a +85,25 m, y −32,25 a +22 m. Ejes de línea: **L7 en y = 12, L8 en y = −20**.

Cómo se protege:
1. En Blender, una colección `FLEXSIM_ANCLAS` con un *empty* por cada entrada del manifiesto (mismo nombre y posición). Bloqueada.
2. Un script de control (`blender/check_anclas.py`) que compara cada máquina de L7/L8 contra su ancla y falla si alguna se movió más de 1 cm o cambió de tamaño más de 2 %.
3. **El origen del mundo no se mueve.** La planta nueva se agrega alrededor de la nave actual.
4. Las líneas nuevas (L1–L6 de Elaborados y todo Ciclo 1 y 2) son **solo visuales**: no suman objetos de FlexSim (no hay licencia para más). Si más adelante se quieren animar, va por un objeto visual aparte o por la web.

## 2. Qué se sabe de la planta (fuentes revisadas)

Fuentes: repo `legacy-trazabilidad` (actualizado con `git fetch` el 23/10; documentos `CONTEXTO-TRAZABILIDAD.md`, `DOCUMENTACION.md`, módulos de `traza-sf` y `panel_de_datos_n-natura`) y `SistemaTrazabilidad-Elaborados` (planeamiento, trenes, formadoras). Ninguno tiene planos ni medidas físicas: describen **el proceso y los puestos**, no la geometría.

### 2.1 Ciclo 1 — faena (de la hacienda a la media en cámara)
| Paso | Qué pasa | Para el 3D |
|---|---|---|
| Corrales | Ingreso de hacienda por tropas (la tropa viene de SAP) | Corrales con mangas, playa de camiones jaula, báscula |
| Lista de matanza | Se asigna un correlativo a cada animal | (sistema, sin objeto físico) |
| Noqueo y playa de faena | Insensibilización, sangrado, cuereado, eviscerado, división en dos medias (lado D/I). Existe faena ritual/kosher | Cajón de noqueo, riel aéreo (noria) con ganchos, plataformas de operarios, sierra de medias |
| Caravana digital | Lectura RFID de la caravana entre matanza y palco | Arco/puesto de lectura junto al riel |
| Palco de tipificación y dientes | Tipificación de cada media (calidad, engrasamiento, dientes, contuso, rito) | Palco elevado sobre el riel |
| Spray chilling | Rociado de las medias al entrar a cámara | Túnel corto con picos sobre el riel |
| Cámaras de oreo | Las medias pasan la noche agrupadas por cámara (códigos tipo "01", "5A"); escaneo con datacollector en la puerta | Batería de cámaras con rieles internos y puertas frigoríficas con código |
| Subproductos | Menudencias (pesaje de cajas propio), digestor, caídos | Sala de menudencias, digestor/grasería, salida de cueros |

### 2.2 Ciclo 2 — de la media a la caja
| Paso | Qué pasa | Para el 3D |
|---|---|---|
| Pesaje de oreo | La media sale de cámara y se pesa en balanza de riel (exige el pH cargado) | Balanza de riel a la salida de cámaras |
| Cuarteo | Se mide pH y la media se corta en 3 piezas: delantero, trasero (pistola) y asado, cada una pesada en su puesto | Sierra de cuarteo, 3 puestos de pesaje con hoja de pared |
| Abasto | Piezas con hueso para mercado interno, se despachan por pedido (no pasan por desposte) | Cámara de abasto y muelle propio |
| Desposte | Los cuartos se despostan en mesas; se emiten etiquetas de corte | Sala de desposte: cintas centrales, mesas a los lados, impresoras |
| Encajado | El corte entra a la caja, se pesa, se cierra y se etiqueta (posiciones A–D en el terminal) | Puestos de encajado con balanza, cinta de cajas |
| Charqueo | Línea de cajas no trazables (recortes) con pesaje propio | Puesto de charqueo junto al desposte |
| Congelado y despacho | Las cajas van a túneles/cámaras y salen a SAP como lote de cajas | Túneles de cajas, cámaras de producto, expedición |

### 2.3 Elaborados (hoy modelado solo L7 y L8)
- **8 líneas** (L1–L8) y **3 trenes de picado**; **8 formadoras** repartidas 3 + 3 + 2 entre los trenes.
- Cada tren: 1 picadora + 2 mezcladoras. La mezcla va a las líneas en **carritos**, salvo **L3**, que tiene descarga directa por transportadora (bloque propio: 1 picadora, 2 mezcladoras, 2 formadoras, 2 estuchadoras).
- Formadoras F19, F26 y TOMAHAWK según la línea; envasado Flow, Estuche (Camma, Bradman Lake) o granel.
- **Un túnel/cámara de congelado cada 2 líneas** y una estuchadora por línea después del túnel.
- Recepción MP congelada (< 1 °C, almacén 1001) y enfriada (≥ 1 °C, almacén 1000), sala de aditivos, sala veggie, supercongelados, expedición PT.
- Detalle por línea en `CIRCUITO_PLANTA.md` (tabla de líneas y productos).

## 3. Lo que falta para ubicar todo (preguntas)

Sin plano, la distribución de edificios es una hipótesis. Lo que hace falta:
1. **Plano o croquis** de la planta (aunque sea a mano o una captura satelital marcada): dónde están faena, cámaras, desposte y Elaborados entre sí.
2. **Cantidad de cámaras de oreo** y su capacidad (medias por cámara); cantidad de túneles de cajas.
3. **Desposte:** cantidad de mesas o puestos y si hay una o dos salas.
4. **Elaborados L1–L6:** ¿están en la misma nave que L7/L8 o en otra? ¿En qué orden y de qué lado?
5. Ritmo de faena (cabezas por hora o por día) si se quiere animar el riel en la web.

Mientras no estén, se trabaja con un **layout tentativo** marcado como tal en la escena (colección `HIPOTESIS_LAYOUT`) para no confundirlo con un dato.

## 3.1 Decisiones del usuario (23/10/2026)
- **Ubicación de los edificios:** no hay plano; se arma un layout lógico siguiendo el flujo y se marca como hipótesis.
- **L1–L6:** en la **misma nave** que L7/L8, **separadas por una pared divisoria**.
- **Detalle de Ciclo 1 y 2:** **máximo**. Se modela con todo el detalle y se mide el peso; si FlexSim o la web se traban, se exporta una versión liviana solo para ese uso (la escena de Blender queda completa).

## 3.2 Layout tentativo (coordenadas de Blender, metros; x al este, y al norte)
La nave actual de Elaborados (x −75 a +75, y −35 a +35, L7 en y = 12, L8 en y = −20) **no se mueve**. Recepción de MP al oeste (x ≈ −63 a −85) y expedición al este (x ≈ +60 a +85), como hoy.

| Sector | x | y | Notas |
|---|---|---|---|
| Elaborados L7/L8 (actual) | −75 a +75 | −35 a +35 | Sin cambios |
| Pared divisoria | −75 a +75 | +35 | La pared norte actual pasa a ser divisoria, con portones y puertas de personal |
| Elaborados L1–L6 (ampliación) | −75 a +75 | +35 a +160 | Ejes de línea cada 20 m (L6 en y = 43, L5 63, L4 83, L3 103, L2 123, L1 143); cada línea ocupa 16,5 m como L7. Al oeste (x −75 a −47) la sala de trenes T1 y T2 y la sala de aditivos; al este, cámaras de PT y supercongelados |
| Ciclo 2: cuarteo, desposte, encajado, charqueo | −210 a −135 | −30 a +70 | Frente a la recepción de MP de Elaborados (los recortes pueden abastecerla); calle nueva en x −135 a −125, pegada a la playa oeste actual |
| Túneles y cámaras de cajas (Ciclo 2) | −210 a −135 | −65 a −35 | 6 muelles al sur; pasillo cubierto al desposte |
| Cámaras de oreo (batería) | −275 a −210 | −30 a +70 | Rieles que salen directo a la balanza de oreo y al cuarteo |
| Abasto | −275 a −210 | −65 a −35 | 4 muelles al sur; pasillo cubierto a las cámaras |
| Playa de faena (Ciclo 1) | −355 a −275 | −10 a +50 | 12 m de alto; riel de oeste a este hacia las cámaras |
| Subproductos (menudencias, digestor, cueros) | −355 a −275 | −65 a −15 | Pasillo cubierto a la playa |
| Corrales y manga | −455 a −370 | −40 a +80 | Manga curva hasta la puerta oeste de la playa (y = 35); playa de jaulas, rampa y báscula al norte |
| Sala de máquinas (frío) y calderas | −355 a −240 | +85 a +130 | |
| Vestuarios, comedor y oficinas | −210 a −150 | +85 a +115 | Cerca del desposte, que es el sector con más gente |
| Calles y patios | — | — | Patio de muelles al sur del bloque oeste (y −86 a −65), calle norte (y 165 a 180), patios a ambos lados de la ampliación |

Se respeta el predio actual: el frente sobre la calle pública al sur (y ≈ −87), la cochera, la playa de camiones oeste (hasta x −125) y la este. Predio nuevo: x −465 a +130, y −86 a +185 (595 × 271 m), con cerco nuevo. El decorado viejo que caía dentro de los terrenos nuevos (calle interna norte, columnas de luz, cerco viejo, árboles, galpón vecino) está en la colección oculta `ZZ_RETIRADO`, no borrado.

### Avance
- **F0 hecha (23/10):** copia de trabajo `blender/PATY_Planta_Completa.blend` (el original queda igual), colección `FLEXSIM_ANCLAS` con las 48 entradas del manifiesto y `blender/check_anclas.py` con la foto de 1.482 objetos protegidos (`blender/anclas_foto.json`). Control: 0 objetos movidos.
- **F1 hecha (23/10):** `blender/f1_masas.py` arma los 14 edificios con el estilo de la nave actual (panel sándwich, franja roja, columnas cada 8 m, techo a dos aguas con cumbrera roja y cerchas, portones con marco amarillo), corrales con manga, calles, patios y cerco. 1.220 objetos, 7.200 polígonos. Control de anclas después de correrlo: 0 movidos. Pendiente de pulir: rótulos de techo que se pasan del borde.
- **F2 hecha (23/10):** `blender/kit.py` + `blender/f2_ciclo1.py`.
  - **Kit** (colección oculta `ZZ_KIT`, se usa con copias enlazadas): media res (82 caras), animal colgado con y sin cuero, gancho con roldana, novillo negro / colorado / Hereford (203 caras), operario (armado con las piezas del operario de la picadora L7) y matafuegos de Poly Haven (`korean_fire_extinguisher_01`, CC0) reducido de 6.258 a 1.410 caras. Poly Haven no tiene hacienda y las librerías con animales low-poly (Poly Pizza, Sketchfab) están desactivadas, por eso los novillos son propios.
  - **Playa de faena:** riel aéreo en tres tramos (4,6 m con el animal entero, baja a 3,4 m en la sierra), colgantes al techo, ~170 carcasas en el riel; cajón de noqueo con puerta guillotina, cajón ritual rotativo, polipasto de izado, canaleta de sangría, plataformas con baranda y escalera en cada puesto, esterilizadores, lavador de cabezas, descueradora con tolva de cueros, mesa de vísceras con 22 bandejas y tolva, sierra de medias, prolijado, lavadora de medias, arco RFID de caravana, palco de tipificación vidriado con escalera, balanza de riel y ~45 operarios.
  - **Cámaras de oreo:** 14 cámaras (01–14) a los dos lados de un pasillo central y uno transversal con el **spray chilling** a la entrada; cada cámara con muros aislados, cielorraso (colección `F2_Oreo_Cielorrasos`, para ocultar y ver adentro), puerta corrediza, cortina de PVC, cartel con número, código de barras en la puerta, 2 evaporadores y 5 rieles; ocupación variada (llenas, a medias, una vacía en lavado): **2.295 medias**.
  - **Subproductos:** menudencias (4 mesas con cinta, ~20 operarios, balanza de cajas, pallets de cajas), digestor (cocinador, condensador, chimenea que sale por el techo, prensa y plataforma) y cueros (pallets de cueros salados y montaña de sal).
  - **Corrales:** 484 novillos en tropas por corral (30 % de corrales vacíos), bebedero en cada corral, fila de animales en la manga y baño de aspersión.
  - Matafuegos con cartel en todo el perímetro interior de faena, subproductos y pasillo de cámaras.
  - Números: la F2 suma 4.586 objetos y 478 mil caras dibujadas, pero solo 1.456 mallas distintas. Toda la escena (sin los árboles de Poly Haven) dibuja 555 mil caras. Control de anclas: 0 movidos.
  - Para F6: si FlexSim recibe el GLB en una sola malla, las copias enlazadas se multiplican en el archivo. Hay que probar si FlexSim acepta un GLB con nodos que comparten malla (sería mucho más liviano); si no, la versión de FlexSim va con menos medias.
- **F3 hecha (23/10):** `blender/f3_ciclo2.py` + `kit_ciclo2()` en `kit.py`.
  - **Kit nuevo:** trasero, delantero y asado (salen del mismo perfil de la media), caja de carne, pallet de 40 cajas, carro rojo de huesos, sierra sinfín, puesto de desposte (mesa + esterilizador + operario + pieza, una sola malla) y puesto de encajado (balanza + terminal + impresora + operario + cajas). **Tomados de la escena sin tocar los originales:** camión de carga de PT, autoelevador, módulo de rack congelado, muelle con niveladora y pallet de expedición (`kit_desde_escena`).
  - **Desposte:** pesaje de oreo con balanza de riel; cuarteo con sierra y 3 puestos de pesaje (trasero, delantero, asado) con su hoja de pared de códigos; rieles de traseros y delanteros que hacen de buffer hasta las cabeceras (217 cuartos colgados); asado por cinta a 3 sierras sinfín; **2 líneas de desposte** (traseros y delanteros) con cinta central, cinta de huesos arriba, 64 puestos cada una, carros de huesos, cortes en la cinta e impresoras de etiquetas de corte; **encajado** con puestos A–D a cada lado al final de cada línea y cinta colectora de cajas hacia los túneles; **charqueo** (2 cintas, 32 puestos, 2 balanzas); carros de recortes en el portón este rotulados "Recortes → Elaborados".
  - **Túneles y cámara de cajas:** 3 túneles de congelado con evaporadores y pallets; cámara de producto con racks en pares espalda con espalda; playa de despacho con 18 pallets, 3 autoelevadores con operario y 6 muelles (4 con camión).
  - **Abasto:** bajada del riel desde el pasillo de cámaras, colector y 6 rieles de armado de pedidos con medias, traseros y delanteros (114 piezas), balanza, escritorio de pedidos y 4 muelles (3 con camión). Subproductos con 2 muelles y camión.
  - Números: la F3 suma 1.316 objetos y 189 mil caras, con 489 mallas distintas. Control de anclas: 0 movidos.
- **F4 hecha (23/10):** `blender/f4_elaborados.py`. L7 y L8 no se tocan: las líneas nuevas son copias enlazadas de las piezas de L7 desplazadas en y (los textos sí se duplican para que cada línea diga su número).
  - **L1, L2, L4, L5, L6** (ejes y = 143, 123, 83, 63, 43): desde la formadora A en adelante, sin el carril B (una formadora y una envasadora por línea, como dice el sistema), con túnel, detector, envasadora, encajonadora, control de peso, robot estibador y sus operarios. Cada una tiene un volcador de carritos en la tolva de la formadora y carritos esperando.
  - **L3** (y = 103): copia completa de L7 = bloque propio con picadora, 2 mezcladoras, descarga directa por cañería, 2 formadoras y 2 estuchadoras (L3A/L3B).
  - **Trenes T1 y T2** (frente a L5 y L2, corridos 22 m al oeste): mesada de desencajado, elevador, picadora y 2 mezcladoras cada uno, con plataforma y operarios, mampara de policarbonato y carritos cargados. **Pasillo de carritos** pintado de amarillo con flechas y sendas hasta cada volcador.
  - **Sala de aditivos** (noroeste): estantes con bolsas, mesa y balanza de pesaje por fórmula, operarios.
  - **Cámara de PT y supercongelados** (x 38 a 75): 54 módulos de rack, piso con escarcha, 3 cortinas a los pasillos de las líneas, autoelevadores, pallets al pie de cada estibado; **3 muelles con camión** al este.
  - Carteles por línea con número, formadora y envasado (de `CIRCUITO_PLANTA.md`).
  - Supuesto: cada línea conserva su túnel (en la planta hay un túnel cada 2 líneas; sin plano no se sabe cuáles comparten). La pared divisoria es el muro norte actual de la nave, con sus puertas de personal; no se le abrieron portones nuevos para no tocar el edificio original.
  - Números: la F4 suma 2.451 objetos y 134 mil caras, con 676 mallas distintas. Control de anclas: 0 movidos.
- **F5 hecha (23/10):** `blender/f5_ambiente.py` y ajustes en `f1_masas.py`.
  - **Árboles de Poly Haven:** los 13 compartían una malla de 1,15 M de caras; se reemplazó por una versión reducida de 50 mil (−96 %), sin cambiar su forma general. La original se puede volver a bajar (Poly Haven `tree_small_02`). Las cortinas de árboles nuevas usan el pino (39 caras) y el árbol de copa (29) que ya estaban en la escena; el de Poly Haven queda solo frente a vestuarios.
  - **Rótulos:** el tamaño se calcula con el largo del texto y del edificio (ya no se pasan del borde), van orientados al lado largo; el del piso pasó junto a la entrada para no quedar debajo de las máquinas, y cada edificio tiene cartel en la fachada sur.
  - **Luminarias LED** colgantes cada 8 × 8 m en todas las naves nuevas (731), **carteles de SALIDA** verdes a los dos lados de cada puerta de personal (14), **alumbrado de calles** con columnas de 9 m, **arbolado** contra el cerco norte y oeste y en la calle de arreo (94 árboles), **estacionamiento del personal** con 32 autos (kit tomado del auto estacionado) y **3 camiones jaula** en la playa de hacienda.
  - Números de toda la escena: 13.340 objetos, 1,66 M de caras dibujadas, pero solo 5.990 mallas y 148 mil caras únicas (antes de la F5 eran 15,7 M dibujadas por los árboles). Control de anclas: 0 movidos.
- **Sin techos, calles, pasto y árboles (pedido del usuario, 23/10):** `quitar_techos()` y `f5_exterior()` en `f5_ambiente.py`.
  - **Techos:** las 17 colecciones de techos y cielorrasos (incluido el techo de la nave original) quedan **excluidas de la escena, no borradas**. Para volver a verlas: `lc.exclude = False` en la capa. `quitar_techos()` hay que correrlo después de `f1()`–`f4()`, que los recrean.
  - **Cerco y frente sur:** el cerco anterior pisaba la calle pública existente (y −90 a −84). Ahora es una poligonal: al este del bloque oeste va en y = −82,5, detrás de la calle; el bloque oeste baja a y = −102 para que entren los camiones. Tiene 5 portones corredizos con pilares (2 al sur y 3 al norte).
  - **Calles:** calle pública extendida al oeste (y −112 a −105) y al este, conector con la existente, ruta norte de 10 m con banquinas, calle oeste, accesos a cada portón, línea central discontinua, bordes y sendas peatonales en los accesos, veredas.
  - **Pasto:** verde en todo el predio y en el campo alrededor (tapa el suelo beige viejo), con 24 lotes rurales (trigo, soja, rastrojo).
  - **Árboles:** 441 nuevos (pino y árbol de copa livianos) a los dos lados de las calles exteriores y 156 en los espacios libres del predio, más 56 arbustos junto a los edificios (kit tomado del arbusto del frente). El reparto evita edificios, patios, calles, corrales y el parque del predio original.
  - Control de anclas: 0 movidos.
- **Pasto corregido (23/10):** las capas de suelo estaban a menos de 1 cm entre sí y titilaban de lejos. Ahora:
  - van separadas en altura: campo −0,25 m, lotes −0,20 m, base del predio −0,15 m;
  - el campo beige original pasó a `ZZ_RETIRADO`;
  - en los espacios libres del predio nuevo hay un **césped elevado 5 cm** sobre el asfalto, como un cantero con cordón: una sola malla (`Cesped_Predio`, 966 franjas, 5.800 caras) con 3 tonos de verde en manchas;
  - pisos, patios, corrales y calles tienen canto de 45 cm, para que no se vea una ranura sobre las capas bajas;
  - se sacaron los árboles de la cortina norte que tapaban los accesos de los portones.
- **Ajustes y servicios (23/10):**
  - **Césped sobre pisos:** cada celda se evaluaba por su centro, así que en los bordes el césped tapaba hasta medio metro de piso. Ahora solo va en celdas de 0,5 m que quedan **enteras** afuera de pisos, patios, calles y equipos exteriores. Verificado con 9.996 rayos sobre los bordes de todos los pisos y patios: ninguno toca césped.
  - **Luces:** sin techos, las luminarias colgantes quedaban flotando. Se reemplazaron por **293 apliques LED de pared** cada 10 m en el perímetro interior de todas las naves, incluida la original (que solo tenía luces de emergencia en las paredes).
  - **Vestuarios, comedor y oficinas** (`blender/f5_servicios.py`): barrera sanitaria (pediluvio, lavabotas, lavamanos); vestuarios de hombres y mujeres con lockers, bancos, 5 duchas, inodoros con cubículo, mesada y espejo; ropería con estantes de uniformes, mostrador y carros; comedor con 9 mesas con bancos, autoservicio, microondas y heladeras; oficinas con 12 puestos con PC y sala de reuniones.
  - **Calderas:** 2 calderas humotubulares con quemador, tablero y plataforma; chimeneas de 16 m; tanque de alimentación con desaireador sobre estructura; bombas; 2 ablandadores y tanque de salmuera; colector de vapor y cañería aislada hacia la planta; reguladora de gas afuera.
  - **Sala de máquinas (amoníaco):** 6 compresores de tornillo sobre platea, 2 recibidores, 3 separadores-recirculadores con plataforma, bombas de amoníaco, enfriador de aceite e intercambiador; colector de succión; consola del frigorista; ducha de emergencia, carteles de peligro y detectores; taller de mantenimiento con bancos, armarios y repuestos; subestación con 2 transformadores y celdas de media tensión; 3 condensadores evaporativos afuera; rack de cañerías hasta las cámaras de oreo.
  - Reutilizado de la nave original (sin tocarla): silla y escritorio, lockers y banco de vestuario, microondas, compresor y tablero eléctrico. Las mesas del comedor original son un bloque macizo, así que se hizo una con patas y bancos.
  - Control de anclas: 0 movidos.
- **Báscula, calles realistas y árboles (24/10)** (`blender/f5_calles.py`):
  - **Árboles mal ubicados:** `Arbol_PolyHaven_33` (original de la escena) estaba dentro del camión del muelle este; con él, otros 9 árboles y arbustos originales habían quedado dentro de los patios nuevos de la ampliación: pasaron a `ZZ_RETIRADO`. Los árboles exteriores ya no se plantan sobre calles, veredas, sendero, parada ni bajo los camiones jaula, y la sombra de los corrales pasó al centro de la calle de arreo. Control final: 0 árboles o arbustos sobre camiones, autos, pisos, calles o patios.
  - **Un solo ingreso de camiones con báscula** (portón norte, x = -130): playa de hormigón con **dos puentes de pesaje de 18 × 3,2 m**, el de **ingreso** (hacia el sur) y el de **egreso** (hacia el norte), porque el camión se pesa al entrar y al salir. Tiene casilla del operador en la isla central con ventanas a los dos puentes, barreras, semáforos, líneas de PARE, flechas, visores de peso, un camión pesándose en cada sentido y otro esperando, garita de vigilancia y barrera en el portón. Los portones sur y este quedan **cerrados como salidas de emergencia**; los camiones llegan a los muelles por la calle C2–Elaborados.
  - **Calles:**
    - patios de maniobra de hormigón con juntas cada 5 m;
    - cordones de hormigón en los bordes contra el césped, cortados en cada cruce, acceso o edificio;
    - bordes amarillos, línea central y flechas en las calles internas; líneas y señales de PARE en los cruces;
    - sendas peatonales; señales de 20 km/h adentro y de 60 en la ruta; cartel de ingreso de camiones;
    - cunetas a los dos lados de la ruta;
    - columnas de alumbrado corridas al borde de las calles (antes había algunas en la calzada).
  - **Personal:** parada de colectivo con refugio sobre la ruta, puerta peatonal con molinete en el cerco y sendero hasta una puerta nueva en el muro norte de vestuarios (cruza la calle norte por una senda peatonal).
  - `blender/construir_planta.py` reconstruye toda la planta en orden (F1 → F5) y termina con el control de anclas.
- **F6 en curso (24/10): exportación a FlexSim y a la web** (`blender/exportar_glb.py`).
  - `exportar()` saca solo lo visible, sin texturas (los materiales con imagen llevan el color promedio de su textura) y con las copias enlazadas como nodos que comparten malla: `assets_v2/PATY_Planta_v10.glb` (colores en sRGB, como pide FlexSim) y `dashboard/web/public/models/planta_v10.glb` (lineales, para three.js). Los dos pesan 34,6 MB: 17.504 nodos y 7.149 mallas.
  - **Prueba en FlexSim (sin guardar):** FlexSim **acepta** el GLB con nodos que comparten malla y los objetos lógicos siguen sobre sus máquinas de L7/L8. Pero dibuja lento: 1 FPS, contra 3 con el v9 (que ya era lento en esta PC).
  - `exportar_flexsim_unido()` arma la versión de FlexSim en **una sola malla** con un grupo por material, como el v9: `assets_v2/PATY_Planta_v10u.glb`, 126 MB. Con ella FlexSim dibuja a 2 FPS.
  - Lo que más pesaba: los 11 árboles de Poly Haven (22 % de los 3 M de triángulos dibujados), las medias de las cámaras (19,5 %), los textos (14 %, letras con 12 pasos por curva) y los matafuegos (5 %). Se redujeron el árbol de Poly Haven a ~12.700 caras, las letras a 2 pasos por curva y el matafuegos a ~310 caras. Medias, hacienda y máquinas no se tocaron.
  - **Árbol de Poly Haven:** ni con la segunda reducción baja de 41.700 caras (el follaje son hojas sueltas de 2 triángulos) y dejando el 40 % de las hojas parecía seco. Era el único árbol de otro estilo, así que sus 18 copias pasaron a usar el árbol de copa low-poly del resto de la planta (`kit_ambiente()` lo hace al reconstruir).
  - **Resultado después de aligerar:** 2,49 M de triángulos dibujados (antes 3,03 M; los textos bajaron de 420 mil a 115 mil). `planta_v10.glb` (web, mallas compartidas) **21,4 MB**, menos que el v9 (25 MB) con solo L7/L8; `PATY_Planta_v10u.glb` (FlexSim, una malla) **67 MB**. En FlexSim, la versión unida dibuja a **2 FPS** contra 3 del v9 en esta PC. Los objetos lógicos de L7/L8 quedan sobre sus máquinas. FlexSim quedó otra vez con el v9 y no se guardó.
  - **Web:** `Scene3D.tsx` carga `/models/planta_v10.glb`. Se apagó la vegetación procedural dentro del predio (el modelo trae la suya) y el bosque lejano se corrió afuera del campo (más de 650 m del centro). `tsc` pasa. Falta verla en pantalla: la extensión de Chrome no estaba conectada.
  - **FlexSim con la planta completa (decisión del usuario, 24/10):** `Tools/OnModelOpen` carga ahora `assets_v2/PATY_Planta_v10u.glb` (antes `PATY_Planta_v9.glb`). Respaldo previo: `PLANTASJ.antes_planta_completa.fsm`. Comprobado:
    - al reabrir, FlexSim dibuja la planta completa;
    - los objetos lógicos de L7/L8 siguen sobre sus máquinas y la licencia sigue en 96/100;
    - los parámetros quedaron en su estado base;
    - una corrida de 4 h da 573 cajas y 3 pallets por línea (llenado desde vacío, como antes); después se reseteó sin guardar.

    Si FlexSim se pone pesado, `exportar_flexsim_unido(excluir=("Cam",))` saca las medias de las cámaras (19,5 % de lo dibujado) solo de la versión de FlexSim.
  - **Para regenerar todo:** en Blender, `construir_planta.py` y después `exportar()` y `exportar_flexsim_unido()` de `exportar_glb.py`. FlexSim identifica las formas por la ruta del archivo: para ver un GLB nuevo hay que reabrir el modelo.
  - Al cerrar FlexSim después de la primera prueba, `PLANTASJ.fsm` quedó guardado (00:23 del 24/10, 2,6 KB más). Revisado al reabrirlo: la forma vuelve al v9 en `OnModelOpen` y los parámetros siguen en su estado base (tiempo 0, `pubOff` 0, `fallOn` 1, `repId` 1, `mttrK` 1, puerto 3000, `fallLast` y `pubLast` en 1e9).
- Los `.blend` no se suben al repo (pesan 78 MB y la carpeta `blender/` de binarios no está versionada); sí los scripts.

## 4. Plan de trabajo por fases

**F0. Preparación (sin tocar el modelo actual)**
- Copiar `blender/PATY_Planta_Elaborados.blend` a `blender/PATY_Planta_Completa.blend` y trabajar solo sobre la copia.
- Crear `FLEXSIM_ANCLAS` desde el manifiesto y el script de control; correrlo antes y después de cada fase.
- Convención de nombres: `C1_<sector>_<pieza>`, `C2_...`, `EL_L<n>_...`, colecciones por sector.

**F1. Plano general (masas)**
- Terreno, calles internas, playa de camiones, cerco, estacionamiento.
- Edificios como volúmenes simples con techo: faena, cámaras de oreo, desposte, cámaras/túneles de cajas, Elaborados (la nave actual queda igual), subproductos, servicios (sala de máquinas de frío, calderas, oficinas, vestuarios).
- Recorrido del producto pintado en el piso entre edificios (Ciclo 1 → Ciclo 2 → expedición; MP → Elaborados).

**F2. Ciclo 1**
- Corrales y manga, cajón de noqueo, riel aéreo continuo con ganchos y medias (instancias), plataformas, palco, arco de caravana, spray chilling, batería de cámaras de oreo con rieles y puertas.

**F3. Ciclo 2**
- Balanza de riel, cuarteo con sus 3 puestos, sala de desposte (cintas y mesas en serie), encajado y charqueo, túneles de cajas, cámaras de producto, abasto y expedición.

**F4. Elaborados completo**
- L1–L6 armadas con el **mismo kit de máquinas de L7** (copias enlazadas: no suman memoria), desde la formadora hasta el paletizado. **L7 y L8 no se tocan.**
- En la realidad no hay una picadora por línea: las líneas se alimentan de **2 trenes compartidos** (1 picadora + 2 mezcladoras cada uno) con **carritos**. Por eso L1, L2, L4, L5 y L6 no llevan picadora ni mezcladoras propias; van a una **sala de trenes** al oeste, con carritos y su recorrido pintado en el piso.
- **L3** lleva su bloque propio: picadora, 2 mezcladoras y transportadora directa a 2 formadoras (L3A/L3B) y 2 estuchadoras.
- Variantes por línea según `CIRCUITO_PLANTA.md`: formadora F19/F26/TOMAHAWK, estuche o flow, cartel con número y producto típico.
- Pared divisoria en y = 35 con portones rápidos y puertas de personal.

**Punto de partida medido (23/10/2026, `blender/PATY_Planta_Completa.blend`, copia de trabajo):** 2.914 objetos. La planta pesa unos 70 mil polígonos (cada línea ~12 mil); los otros 15 millones son 13 árboles de Poly Haven de 1,15 M cada uno, que conviene reemplazar por versiones livianas antes de exportar. Hay margen para el detalle máximo. El GLB v9 no sale directo del .blend: es el v5 exportado más el script `assets_v2/make_planta_v6.py` (colores, pasto, vegetación, sin estibadores B); el pipeline nuevo tiene que incorporar esos cambios.

**F5. Ambiente y lectura**
- Rótulos en el piso por sector, señalética, iluminación, personas y montacargas estáticos, colores por ciclo.

**F6. Exportación y rendimiento**
- La escena completa puede multiplicar polígonos y peso (el GLB actual ya pesa 25 MB). Para que FlexSim y la web la sigan moviendo:
  - piezas repetidas (ganchos, medias, mesas, cajas) como instancias o mallas unidas por material;
  - sin texturas pesadas (colores planos como hoy);
  - dos salidas: `PATY_Planta_v10.glb` para FlexSim (un solo objeto) y una versión comprimida para la web;
  - medir: tiempo de carga en FlexSim, FPS en la web, tamaño del archivo.
- Antes de reemplazar el v9: control de anclas, abrir `PLANTASJ.fsm` y verificar que cada objeto lógico sigue encima de su máquina, correr 24 h y comparar contra E1 (los resultados no deben cambiar: es solo visual).

**F7. Web**
- Mostrar los sectores nuevos en la vista 3D con nombre y una ficha informativa (sin datos en vivo, porque FlexSim solo simula L7/L8). Marcarlos como "solo visual".

## 5. Cómo se va a construir
- Todo por **scripts de Python en Blender** guardados en `blender/` (uno por fase), para poder regenerar la escena si cambia un dato del plano.
- Cada fase termina con: control de anclas, capturas desde arriba y en perspectiva, y una nota en este archivo.

## 6. Datos y confidencialidad
- Este repo es público: se documenta el proceso a nivel general. No se copian datos de producción, nombres de tablas internas, direcciones de servidores ni credenciales de los sistemas de Marfrig.
