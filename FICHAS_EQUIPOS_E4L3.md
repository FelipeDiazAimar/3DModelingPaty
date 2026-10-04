# Fichas de equipos — E4 L3 (69 g) y línea piloto

Extraído de `C:\Users\Asus\Downloads\MANUALES` por 7 agentes (2026-09-26).
`.txt` extraídos en `%TEMP%\opencode\` para re-grep. Lo no hallado va a
`PREGUNTAS_PENDIENTES.md`.

## Formadora F26 PLC (E4 L3)
- Velocidad: **25–90 carreras/min** (visor carreras/min).
- A 69 g/cavidad: 103,5–372,6 kg/h por cavidad (media 238).
- Tolva 454 kg → ~18 min autonomía a máx (4 cav).
- Molde: plato 482,6×152,4 mm (F19, ref), espesor 4,8–25,4 mm.
- Cambio de molde: **sin tiempo oficial** (~20 pasos, 2 personas + limpieza
  espuma 10–15 min → supuesto FlexSim 30–60 min, a medir).
- Servicios: 20–32 kVA trifásico, aire 6,9 bar/140 l/min (con papel),
  agua ~3,8 l/min, 77–81 dB(A). Peso ~3,4–3,6 t, despeje 0,914 m.
- Dotación: 1 operario (+1 en cambios).

## Tren de picado (Weiler 1612 grueso → 1109 fino → mezcla probable)
- 1612: 3277 kg, 1109: 1751 kg. Placas 19–32 mm.
- Alimentación por cinta 24BC, 1 bloque por vez. **kg/h no consta.**
- Mezclador D&D **2500 L** nominal (22,5 CV); M360A 32,5 HP.
- Batch kg y tiempo de mezcla: **no constan** (D&D: "tiempo necesario").
- Carros limitados por izaje **181 kg/viaje** (400 lb FBL).
- Orden sugerido (no citable): picado → mezclado → descarga.

## Estuchadora CAMA CL156 (E4 L3, estuche SÍ)
- 400 V, 6 bar (cola 2–3), 1 operador + cambio de formato por recetas OP7.
- **Velocidad estuches/min: no está en texto** (planos/imágenes).
- Dimensiones en plano (imagen, no extraíble).

## Envasadora FRIPACK HP 3S (L3 = 18160/18162)
- **150 paquetes/min máx** (producto 70–400 mm largo, 5–70 alto, 10–130 ancho).
- 220 VCA 2,2 kW, ~500 kg, 5 recetas, empalme film sin parar.
- Cinta salida cajas: 420 mm × 9240 mm; entrada estuchadora 150 × 3280 mm.
- "Camma" = leva mecánica, no marca: L3 usa FRIPACK.

## Túnel Advantec L3/L4 (impingement)
- Correa 1250/1800 mm, v = 1,2–24 m/min; **t = L/v** (L por módulos).
- Receta planta (no en manual): T_aire, T_evap, kg/h. R717, 1 operador HMI.
- Ej: 3 módulos ~15 m a 3 m/min → ~5 min residencia.

## Fin de línea (apilador Torfresma L3/L4 → envelopadora, encintadora, envolvedora)
- Apilador: alimenta envelopadora en sincronía, 1 operador, cambio por disco+receta.
- Encintadora DG900L, envolvedora DG240 (1 operador, plato 1500 mm).
- Ref Torfresma L7/L8: **69 g → 485/min**, rechazo con retardo + candado,
  split granel/estuche manual, cajas manuales en rodillos.

## NO va en el modelo hamburguesa
- Tren de empanado (batter/breeder): solo milanesas/nuggets.
