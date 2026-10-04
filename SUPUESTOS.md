# Supuestos del modelo — Planta San Jorge v1.1

Cada supuesto con estado y qué cambia si el valor real difiere.
**Leyenda:** ✅ confirmado (manual/sistema/planta) · 🔶 supuesto razonable ·
🔴 supuesto grueso (calibrar urgente).

## Proceso y equipos
| # | Supuesto | Estado | Si difiere |
|---|---|---|---|
| S1 | Molde F26: **4 cavidades** × 69 g = 276 g/golpe | 🔴 | Tasa de formadora escala lineal (±50 % si son 6) |
| S2 | Formadora **57 golpes/min** (rango manual 25–90) | 🔶 | Throughput línea ±60 % |
| S3 | Batch mezcladora **1500 kg / 20 min**, 2 mixers por tren que
  **alternan** (uno descarga mientras se llena el otro) | 🔶 (usuario) |
  Modelado como 1 mixer PT 600 s = mismo throughput promedio; la
  alternancia fina (pull) queda futura |
| S4 | Picadora PT **1,5 s/batch** (capacidad real desconocida) | 🔴 | Puede ser el cuello real |
| S5 | Túnel **300 s** por batch, capacidad infinita | 🔴 | Con receta (T°, t) se modela como conveyor con residencia |
| S6 | Estuchadora/envasadora **0,4 s** (150 paq/min ✅ manual) | ✅ | — |
| S7 | Orden L3: formar → túnel → estuchar → envasar | 🔶 (usuario: túnel tras formar) | Reordenar links si cambia |
| S8 | L1 directo a sink (granel, sin frío) | 🔴 | Agregar cámara si lleva |
| S9 | Distribución T1/T2 a líneas: directa por links fijos | 🔶 | Real es por carritos/turno (lógica de ruteo futura) |
| S10 | Split batch→burgers del Separator: **pendiente** (picklist con código) | 🔴 | Define todas las tasas aguas abajo |
| S11 | IAT recepción **1 s/batch** (llegan más que suficiente) | 🔶 | Solo afecta stock inicial |
| S12 | 1 operario por formadora, sin turnos ni paros | 🔶 | Turnos = Time Tables (pendiente mecanismo) |
| S13 | Changeover 30–60 min: **no modelado** (pende mecanismo de paros) | 🔴 | Baja disponibilidad real ~5–10 % |
| S14 | Layout en grilla (espaciado 6 m, líneas en Y) | 🔶 | Solo visual; pedir plano para gemelo fiel |
| S15 | Carritos = flujo directo instantáneo (sin tiempo de transporte) | 🔶 | Agregar TaskExecuter + travel si importa |

## Confirmados (no supuestos)
- Clases, conexiones A/S, túnel Advantec/Scanico/FPF existen, Fripack 150/min,
  CAMA estuche, Torfresma fin automático, cámaras cada 2 líneas, T1/T2
  comparten L1–L6, L3 con líneas propias, 3 turnos, encajado automático.

- Cintas (7 en v1.2: L1/L2/L4/L5/L6/L3A/L3B): puestas y conectadas, pero el flujo medido usa los links directos (`cinta.in = 0`). Verificado: el handshake completo de transfers SÍ mueve ítems (119>109 en prueba aislada); cómo forzarlo determinísticamente sigue abierto.
