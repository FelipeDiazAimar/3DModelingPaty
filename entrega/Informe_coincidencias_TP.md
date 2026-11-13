# Informe de coincidencias: documento, repositorio y video

Fecha: 13/11/2026. Documento entregado: `Buffa-DiazAimar-Micheloud.docx` y `.pdf` (17 páginas numeradas más la portada). Video: `VIDEO SIMULACION.mp4`, 14:52, con las voces del equipo.
Fuente de verdad usada: el modelo vigente descrito en `SUPUESTOS_v2.md`, `PENDIENTES.md`, `E1_FINAL.md` y `estocastico_camiones/analisis.json` (corridas del 10/11/2026), y los datos de `datos_trazabilidad/fitting_series/`.

## 1. Qué se corrigió en el documento

| Tema | Antes | Ahora |
|---|---|---|
| Cuello de botella | Formadora al 89 % | Hipótesis inicial refutada: cuello en mezcladoras (60,5 t/día, 75 % de ocupación) por el lavado de 30 min; formadora al 49 % |
| Batch | 1.500 kg, 10 cargas; 3.500 / 900 / 1.200 s | 1.050 kg, 7 cargas; 2.450 / 630 / 840 s (ficha × 0,7) + 1.800 s de lavado |
| Entrada de MP | Tabla empírica por franja horaria (el modelo no la usaba) | Camiones reales remuestreados (66 días, 306 camiones, 240 intervalos); tabla de Monte Carlo solo para el espaciamiento entre pallets de un camión |
| Pallet de PT | 144 cajas fijas (720 kg) | Se sortea uno de los 500 pesos reales; cajas = peso ÷ 5 kg (≈ 879 kg por pallet en el modelo) |
| Regla de K-S | Invertida | Si D > Dcrit se rechaza; Dcrit = 1,36 / √n |
| Tabla de Monte Carlo de arribos | Columna de probabilidad corrida y último intervalo en 28,42 min | Recalculada desde `iat_cdf.csv` (49 puntos; el máximo real es 62,46 min). Versión agrupada en el cuerpo y completa en el Anexo B, con un ejemplo de uso |
| Tabla de Monte Carlo de pesos | No existía (se había pegado la de arribos) | Agrupada por clases de peso, calculada de `pesos_PT_kg.csv` |
| MTBF / MTTR | Valores corridos de fila | Tabla con los parámetros que usa el modelo, aclarando que son de la línea 3 y se aplican a L7 y L8 |
| Confiabilidad por equipo | Filas corridas | Rearmada desde `paros_eventos.csv` (1.267 eventos, 12.610 min) |
| Supuestos y tiempos de servicio | Tablas desalineadas | Rehechas con tablas reales |
| Anexo A | Escenarios E2 «1.600 kg/h», E3 «RCM + SMED», E4 «buffer» que no existen en el modelo | Resultados reales E1 a E4 (10 réplicas, IC 95 %, diferencias pareadas, capacidad implícita) |
| Declaración de IA | 3 filas con `[COMPLETAR]` | Tabla completa |
| Estructura | Sin índice ni numeración | Portada y encabezado con el formato de la consigna, índice automático y secciones numeradas igual que la consigna (1 a 5) |
| Texto | Typos («Estadísticvos», «3.,42», «kilogremos», etc.) | Corregidos |

Cifras verificadas contra los datos: n = 49, media 2,617, mediana 1,028, desvío 8,94, CV 3,42, D = 0,4126 (Dcrit 0,1943); paros n = 1.267, D lognormal 0,1399 y exponencial 0,2097 (Dcrit 0,0382); pesos n = 500, D = 0,146 (Dcrit 0,0608). El «92 % de los arribos en menos de 2 min» es correcto (91,8 %).

## 2. Qué coincide con el video

Las cifras del documento y del video coinciden: 49,1 pallets/día y 42,5 t/día, cuello en mezcladoras (60,5 t/día), E2 +9,3 [+4,5 ; +14,1] (+18,9 %), E3 +3,6 [−0,3 ; +7,5] contra E2, E4 +0,6 [−0,0 ; +1,2], batch de 1.050 kg, 10 réplicas de 24 h, entrada de 8 a 80 batches por día y 73 herramientas del MCP. El video dura 14:52, bajo el máximo de 15 minutos.

## 3. Discrepancias que quedan (no se tocaron)

### En el video
1. **Diapositiva 34 (web, cinemática «Pallet a la caja»).** Las tarjetas grabadas dicen «11 · Estibado: el robot arma el pallet de 144 cajas», «9 · Envasado: detector de metales» y «10 · Encajonado: cajas de 5 kg con control de peso», y un panel muestra «Batch de 1500 kg → 10 cargas». El modelo vigente no tiene detector de metales ni control de peso, el pallet sale del peso real y el batch es de 1.050 kg. Hay que cambiar el texto en el código de la web y volver a grabar `cine_resumen.mp4`.
2. **Marca.** La portada y el cierre mencionan Paty. La consigna pide no nombrar la organización; hay que consultarlo con el profesor o sacarla.

### En el repositorio (código de la web, modelo anterior)
- `dashboard/web/lib/cine.ts:65` («22 pallets… 144 cajas»), `:92` («pallet de 144 cajas») y `:169` («batch de 1500 kg»).
- `dashboard/web/components/Console.tsx:220` («Batch de 1500 kg → 10 cargas → 300 cajas»).
- `dashboard/web/app/masa/page.tsx:7-9`: `KG_BATCH = 1500` y `KG_PALLET_PT = 144 × 5`; afecta los números del balance de masa.
- `dashboard/web/app/escenarios/page.tsx`: E3 «24 pallets por turno»; E4 y la lectura de la línea 160 («el batch de 1500 kg rinde 4,0 pallets/día más»); línea 181 («52 pallets de 1500 kg»).
- `dashboard/web/components/E1.tsx:77`: texto de validación del modelo anterior (144 bandejas = 720 kg).
- `dashboard/web/public/e1/cuellos.json` y `e4.json`: datos del modelo anterior.
- `SUPUESTOS.md`, `CONTEXTO_MASTER_SIMULACION.md` y `PLAN_E1_VALIDACION.md` describen la versión 1 (batch de 1.500 kg); `documents/Simulación - Trabajo Integrador.md` es la versión vieja del documento (está fuera del repositorio).
- La rama `video-audio-recorte` está sin mergear a `main` (ver el aviso del feedback del 09/11).

## 4. Decisiones que dependen del grupo

1. **Enlace de descarga:** la sección 5 tiene un campo resaltado en amarillo para pegar el enlace. Hay que armar la carpeta (modelo `.fsm` final con `assets_v2`, CSV, scripts, MCP, web, video), habilitar el acceso para la cátedra y probarlo en incógnito. Los nombres de archivo y de repositorio incluyen la marca; conviene una carpeta limpia.
2. **Declaración de IA:** confirmar herramientas y usos. Se mantuvieron Claude y Antigravity del documento anterior y se agregaron NotebookLM (por `FITTING_EVIDENCIA.md`), Fish Audio, ElevenLabs, HyperFrames y Blender con scripts.
3. **Validación contra la planta:** el documento dice que el modelo no se calibró contra la producción total, igual que el repositorio («no se compara contra valores de planta»). `analisis.json` registra que el modelo da 42,5 t/día contra 56,0 t/día del tablero (−24 %). El profesor puede preguntar por la validación.
4. **σ de la lognormal:** el modelo usa 0,9; el ajuste de los logaritmos da 0,72. El documento lo declara como parámetro adoptado.
5. **Código EST:** el modelo asigna los datos del código EST al robot estibador. En el tablero de paros EST parece ser la estuchadora (el documento anterior la llamaba así). El documento dice «Estibadores (datos del código EST)».
6. **Fecha de la muestra de arribos:** el documento mantiene «03/10/2026», tal como figura en `FITTING_EVIDENCIA.md`.

## 5. Estado del video (13/11/2026)
- Con las voces del equipo: tablero de FlexSim, conclusión de la simulación, web (cinemática y apartados), E3, E4 y conclusiones finales.
- **Falta el audio de E2 y del arranque de E3** («Ahora lo obvio…», «La propuesta: sumar 1,5 veces la materia prima»). Ahí habla la IA hasta que lo graben. Al recibirlo, agregar los tramos a `video_presentacion/audio/equipo_clips.json` y renderizar.
- Los textos de la cinemática de la web grabada (`cine_resumen.mp4`) siguen con «144 cajas», «detector de metales», «control de peso» y «batch de 1500 kg»: hay que corregir `dashboard/web/lib/cine.ts` y volver a grabar.

## 6. Qué no se pudo verificar
No se abrió el `.fsm` en FlexSim: los parámetros del modelo se tomaron de los documentos y scripts del repositorio. El audio del video no se escuchó completo.
