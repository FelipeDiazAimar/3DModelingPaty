# 3DModelingPaty — Gemelo digital de la planta PATY San Jorge

Planta de elaborados (150 x 70 m, líneas L7 y L8) modelada en **Blender**, simulada en **FlexSim 2026** y visualizada en tiempo real en una **web** (Next.js + three.js).

## Qué hay en este repo
| Carpeta / archivo | Contenido |
|---|---|
| `PLANTASJ.fsm` | Modelo FlexSim vigente (96/100 objetos de licencia). Carga el visual 3D, las formas de ítems y el publicador al abrir. |
| `assets_v2/` | Visual 3D (`PATY_Planta_v9.glb`, generado desde `v5` con `make_planta_v6.py`), formas de pallets, cajas, hamburguesas y generadores `make_*.py`. |
| `blender/` | Fuente de Blender de la planta (`PATY_Planta_Elaborados.blend`). |
| `manifests_v2/` | Posición y tamaño de cada máquina (coordenadas de Blender) para ubicar los objetos lógicos de FlexSim. |
| `dashboard/web/` | Web en tiempo real: planta 3D, KPIs, reproductor y dashboards por tema. |
| `dashboard/flexsim/` | Código de los nodos que publican datos desde FlexSim a la web (`Tools/Publicar`). |
| `SUPUESTOS_v2.md` | Supuestos, tiempos, reglas de licencia y decisiones del modelo. |
| `datos_trazabilidad/` | Evidencia estadística (ajustes, CSV agregados). Los JSON crudos de la planta no se publican. |

## Correr todo en local
1. **Web:** `cd dashboard/web && npm install && npm run dev` → http://localhost:3000
2. **FlexSim:** abrir `PLANTASJ.fsm` y dar Run. El modelo envía un JSON cada 10 s simulados a `POST /api/ingest`; la web lo muestra sola.
   Sin FlexSim, el botón **Demo** de la web carga datos sintéticos rotulados.
3. Para controlar FlexSim desde un asistente se usa el servidor MCP: https://github.com/FelipeDiazAimar/MCP_Flexsim

## Deploy en Vercel
- Importar el repo y poner **Root Directory = `dashboard/web`** (Framework: Next.js; ya hay `vercel.json`).
- Variable de entorno: `NEXT_PUBLIC_DEMO=1` (ver `.env.example`). En Vercel no hay FlexSim ni estado compartido entre funciones, así que el sitio arranca en **modo demo**.
- Para ver datos reales hay que correr la web en la misma red que FlexSim (modo local).

## Regenerar el visual
`cd assets_v2 && python make_planta_v6.py` (usa `PATY_Planta_v5.glb`; genera `v9`) y `python make_planta_v6.py --web` (copia para la web en `dashboard/web/public/models/planta.glb`). FlexSim cachea formas por nombre de archivo: al cambiar el visual, usar un nombre nuevo.

## No incluido
Copias de respaldo `.fsm`, STL de prueba de ~250 MB, y los JSON crudos de la planta (proveedores, productos, tablero). Ver `.gitignore`.

---

# Historial: modelado inicial en FlexSim (línea 3)

## Fábrica Paty — San Jorge (modelado FlexSim)

Carpeta del proyecto de modelado profesional: del circuito real (ver
`CIRCUITO_PLANTA.md`) a un gemelo funcional en FlexSim con el MCP
(`mcp_flexsim_opencode`, 71 tools).

## Plan
1. Completar `PREGUNTAS_PENDIENTES.md` (datos de planta).
2. Elegir línea/producto piloto (recomendado: 1 línea, ej. E4 L3 o PDC L1).
3. Armar el modelo por chat con el MCP (crear→conectar→configurar→correr→medir).
4. Calibrar con números reales (rendimientos, capacidades, dotación).
5. Réplicas y escenarios (semillas, `run_experiments`, gráficos fuera).

## Modelos (.fsm)
Cada modelo vive acá con nombre `lineaX_producto_vN.fsm` (nunca sobre la
plantilla `bridge/mcp_template.fsm` del repo MCP).

- `linea3_E4_v1.fsm` — piloto L3 directo (14 objetos). Supuesto 4 cavidades.
- `linea3_E4_v2.fsm` — topología real: túnel compartido + estuchadora por
  línea + 2 operarios S (17 objetos). Corre 1800 s punta a punta.
- `planta_sanjorge_v1.fsm` — planta: T1/T2 (picadora+2 mixers+distribución),
  cámaras cada 2 líneas, L1/L2/L4/L5/L6, bloque L3, 7 operarios (46 objetos,
  42 flujo + 7 recursos). Estado: estructura verificada; tasas en
  calibración (bisección: colas multi-salida reparten bien 150/149/0;
  falta Split/Unpack Quantity de Separators para pasar batch→burgers).
- `planta_sanjorge_v1_5.fsm` — v1.4 con salidas unificadas: todas las
  líneas confluyen al almacén único `AlmPT` (FloorStorage) y de ahí al
  `SinkEXP` de expedición (47 objetos; AlmPT in=4 out=4).
- `planta_sanjorge_v1_6.fsm` — v1.5 + recepción real (montacargas MONT1+DSP1,
  rack AlmMP, 3 pies con QPal/Desencajado/OpDes/cinta/pie). 62 objetos.
- `planta_sanjorge_v1_7.fsm` — mixers unificados (1 por tren, PT 600 s),
  almacén PT también en rack, MONT2+OpMont al final. 61 objetos;
  AlmMP 1799/1799, AlmPT 2/2. Mixers con forma ribbon real. **La actual.**

## Formas 3D (en `mezcladora_3m.stl`, `picadora_3m.stl` y Downloads)
- Mezcladora ribbon (STL→3 m con `utility/scale_stl.py`, ahora con ASCII):
  MixT1/T2/L3 en v1.7 (índice 30).
- Picadora (STL ASCII 241k tris → 3 m): PicT1/T2/L3 en v1.7 (índice 93).
- Hamburguesa GLB: carga y renderiza bien (`.glb` aceptado aunque no está
  en docs). Carne FBX: carga asignada. STEP nativo: carga pero invisible.
- Caja delivery (STL→1 m): 289 ítems de QPalT1 pintados como cajas con
  `setobjectshapeindex` por subnodo (`paint_items.py`, verificado visual).
- Reglas: nunca `o.size` sobre formas importadas (rompe el render);
  escalar el ARCHIVO antes (`scale_stl` binario+ASCII+rotaciones x/y/z).
  Screenshots en vivo para verificar.
- **Persistencia**: las asignaciones por script son POR SESIÓN (verificado:
  tras guardar+reabrir se pierden). `planta_sanjorge_v1_7.shapes.json` las
  versiona: al abrir el modelo, correr `flexsim_apply_shapes`.
