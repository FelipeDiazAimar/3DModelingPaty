# Circuito productivo — Planta San Jorge (hamburguesas Paty)

Fuente: sistema `SistemaTrazabilidad-Elaborados` (solo lo que el sistema afirma;
ver lagunas en `PREGUNTAS_PENDIENTES.md`). Relevado 2026-09-26.

## A. Recepción MP cárnica
1. Camión → recepción documental (remito + sanitario + factura).
2. Muestreo calidad por lote (**3 a 9 cajas**).
3. Etiquetas pallet + calidad → cierre báscula (bruto-taras) → egreso camión.
4. Por temperatura: **<1 °C → almacén 1001 (congelado)** / **≥1 °C → 1000 (enfriado)**.
5. Muestreo FOS (**5-6 cajas/pallet**, tenor graso) → alta SAP → traslados internos.

## B. Almacenaje + preparación
6. Stock en `1000/1001` (centro 1239). Almacén `22` = consumo/preparación.
7. Aditivos: bolsas por fórmula (kg/bolsa fijo; total = bolsas × kg/bolsa).
8. Consumo MP al pie de línea (pickeo de pallets, devoluciones, cierres).

## C. Mezclado → formado → envasado
9. **Mezcladora → batch**: `peso_inicial`, descargas `intermedia|cierre`
   (kg descarga = peso_anterior − peso_actual).
10. **Carritos** llevan mezcla a líneas (línea asignada por supervisor).
11. **Tren (picado) → formadora (F19/F26/TOMAHAWK) → línea 1-8**.
12. Envasado por producto: `FLOW` / `ESTUCHE` / `Granel`.
13. Etiquetado PT → **pallet mono-SKU** (HU `T`+9 dígitos, cajas × kg/caja).
14. **Supercongelados** (programa semanal) → stock/expedición.

## D. Cierre
15. Declaración producción + consumo a SAP.

## Topología real (dato de planta 2026-09-26)
- **T1**: 1 tren de picado + 2 mezcladoras → puede ir a **L1–L6**.
  **T2 igual, compartiendo las mismas líneas.**
- Mezcladora → línea: con **carritos**, EXCEPTO L3 que usa
  **líneas transportadoras** (descarga directa).
- Tras cada línea hay **cámara/túnel de congelado cada 2 líneas**,
  luego **1 estuchadora por línea** (tras la cámara).
- L3 sale **todo a estuche**. Cambio de formato: **30–60 min**.
- Bloque L3 propio: 1 picadora + 2 mezcladoras + descarga directa +
  2 formadoras + 2 estuchadoras (= L3A/L3B con su Fripack c/u).

## Líneas y productos (catálogo del sistema)

| Línea | Formadora | Estuche | Envasadora | Producto ej. |
|---|---|---|---|---|
| L1 | F19 | no | — (PDC) | PDC 271002 120 g, 165 caj/pallet, 5.76 kg/caja |
| L2 | F19 | sí | Camma | — |
| L3 | F26 | sí | Camma | E4 270603 69 g, 91 caj, 6.62 kg |
| L4 | F19 | sí | Bradman Lake | E4 |
| L5/L6 | F26 | no | — (M10) | M10 270775 44.9 g, 56 caj, 17.24 kg |
| L6/L7 | F26 | — | — | SUP 236213 125 g, 144 caj, 5.0 kg |
| L8 | TOMAHAWK | — | — (SUP) | SUP |

## Parámetros numéricos confirmados
- Centros: 1239 San Jorge A09 (1240 Baradero, 1241 Arroyo Seco, 1300 Pilar).
- Rendimientos planificados (kg Lu–Ju / Vi), ej. SUP L7 29620/31289, E4 L3 25114/26529.
- Capacidad formadora kg/h: CLASICO/FINITAS/PATY CASA 982; EXPRESS/BARFY 921;
  PATYNESA 1062; MILANESA 892; TROCITOS 1068; MCD 909.
- ⚠️ `capacidad_bache_kg 1500 (1200 MCD)` figura como valor **inventado** en el
  código — no usar sin confirmar.

## Flujos laterales
- `cajas_calidad` (1 caja/pallet) + reincorporación mismo producto/lote.
- Reaprovechamientos y barrido (reingreso físico a confirmar).
