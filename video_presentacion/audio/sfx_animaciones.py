"""Convierte las animaciones del video en efectos de sonido: cada aparición, movimiento, barrido, dibujo y contador
de cada escena tiene su sonido, ubicado en el instante exacto en que ocurre.

Entrada:  audio/harvest.json  (los tweens de GSAP de cada escena, medidos en el estudio de Hyperframes: ver README)
          audio/cues_sfx.json de base (cortes de diapositiva, golpes, glitch... los arma cues.py)
Salida:   audio/cues_sfx.json  (la base + los efectos por animación), que lee generar_efectos.py

Reglas (por animación, `v` = propiedades que anima):
  aparece (opacity 0→1)            texto → "textin" (blip suave); panel/imagen → "pop"; elemento grande → "popbig"
  se mueve (x/y/xPercent/rotation) rápido → "swipe"; lento → "slide"
  escala (scale/scaleX/scaleY)     "pop"; barras que crecen → "grow"
  dibuja (strokeDashoffset/clip)   "draw"
  contador / texto cambia          "tick"
  desaparece (opacity → 0)         "swipe" suave (sale con aire)
Muchos tweens a la vez (palabra por palabra, letras, barras en escalera) se agrupan: suena un efecto por cada ~0,11 s,
con más cuerpo cuanto más elementos entran. Máximo MAX_POR_SEG efectos por segundo; si hay más, quedan los de más prioridad.

Uso: python sfx_animaciones.py
"""
import json
import re
from pathlib import Path

AQUI = Path(__file__).resolve().parent
MAX_POR_SEG = 7
VENTANA = 0.11
PRIORIDAD = {"hit": 10, "shatter": 9, "riser": 8, "glitch": 8, "whoosh": 7, "zoomin": 7, "shimmer": 7, "popbig": 6,
             "pop": 5, "slide": 5, "swipe": 4, "grow": 4, "draw": 4, "scribble": 6, "textin": 3, "tick": 2}
# escenas donde la animación no corresponde a objetos que se ven (fondos, reloj interno)
IGNORAR_ESCENAS = {"s99-subs"}
IGNORAR_OBJETIVOS = ("fx-vignette", "grain", "s99-num", "w8-wipe")


def clasificar(tw):
    v, d = tw["v"], tw["d"]
    tg = (tw["tg"] or ["?"])[0]
    nombre, tag, dim, texto = (tg.split("|") + ["", "", "", ""])[:4]
    if any(x in nombre for x in IGNORAR_OBJETIVOS):
        return None
    try:
        w, h = [int(x) for x in dim.split("x")]
    except ValueError:
        w = h = 0
    n = tw["n"]
    es_texto = bool(texto.strip()) and tag in ("SPAN", "H1", "H2", "P", "B", "DIV") and (w * h < 600_000 or w == 0)
    if "textContent" in v:
        return "tick"
    if "strokeDashoffset" in v or "clipPath" in v:
        return "draw"
    o = v.get("opacity")
    if o == 1 or o == "1" or (o is None and tw["from"] and ("scale" in v or "y" in v or "x" in v)):
        if d < 0.1:
            return None
        if es_texto and (n > 1 or len(texto) > 3):
            return "textin"
        if w * h > 700_000:
            return "popbig"
        return "pop"
    if o == 0 and d >= 0.15:
        return "swipe"
    if any(k in v for k in ("scaleX", "scaleY", "width", "height")) and d >= 0.2:
        return "grow"
    if any(k in v for k in ("x", "y", "xPercent", "yPercent", "rotation", "rotationX", "rotationY")) and d >= 0.25:
        return "swipe" if d < 0.7 else "slide"
    if "scale" in v and d >= 0.15:
        return "pop"
    return None


def main():
    h = json.loads((AQUI / "harvest.json").read_text(encoding="utf-8"))
    base_p = AQUI / "cues_sfx.json"
    base = [e for e in json.loads(base_p.read_text(encoding="utf-8")) if not e.get("auto")]
    idx = (AQUI.parent / "film" / "index.html").read_text(encoding="utf-8")
    ventanas = {}
    for m in re.finditer(r'<div\s+id="[^"]+"([^<>]*?)data-composition-id="([^"]+)"([^<>]*?)></div>', idx, re.S):
        b = m.group(1) + m.group(3)
        st, du = re.search(r'data-start="([\d.]+)"', b), re.search(r'data-duration="([\d.]+)"', b)
        if st and du:
            ventanas[m.group(2)] = (float(st.group(1)), float(st.group(1)) + float(du.group(1)))
    ev = []
    for escena, datos in h.items():
        if escena in IGNORAR_ESCENAS:
            continue
        ini, fin = ventanas.get(escena, (0, 1e9))
        for tw in datos["tweens"]:
            if tw["set"] or tw["l"] < ini - 0.01 or tw["l"] > fin - 0.12:   # fuera de la ranura: no se ve
                continue
            tipo = clasificar(tw)
            if tipo is None:
                continue
            n = max(1, tw["n"])
            # tweens con stagger: el sonido se reparte en el tiempo de entrada del grupo, no solo en el primer elemento
            ev.append({"t": round(tw["l"], 3), "tipo": tipo, "n": n, "escena": escena, "d": tw["d"]})
    # agrupar por ventana y tipo parecido
    ev.sort(key=lambda e: (e["t"], -PRIORIDAD[e["tipo"]]))
    grupos = []
    for e in ev:
        if grupos and e["t"] - grupos[-1][0]["t"] < VENTANA:
            grupos[-1].append(e)
        else:
            grupos.append([e])
    elegidos = []
    for g in grupos:
        mejor = max(g, key=lambda e: PRIORIDAD[e["tipo"]])
        cuerpo = min(1.0, 0.55 + 0.12 * len(g))
        elegidos.append({"t": mejor["t"], "tipo": mejor["tipo"], "cuerpo": round(cuerpo, 2), "auto": 1})
    # entradas escalonadas largas: un tick suave cada 0,2 s mientras dura el grupo (palabras o letras que van entrando)
    extra = []
    for e in ev:
        if e["n"] >= 6 and e["tipo"] in ("textin", "pop", "swipe"):
            dur = min(e["d"], 3.0)
            t = e["t"] + 0.2
            while t < e["t"] + dur - 0.05:
                extra.append({"t": round(t, 3), "tipo": "tick", "cuerpo": 0.5, "auto": 1})
                t += 0.2
    elegidos += extra
    elegidos.sort(key=lambda e: e["t"])
    # tope por segundo
    final, ventana = [], {}
    for e in sorted(elegidos, key=lambda e: -PRIORIDAD[e["tipo"]]):
        s = int(e["t"])
        if ventana.get(s, 0) >= MAX_POR_SEG:
            continue
        ventana[s] = ventana.get(s, 0) + 1
        final.append(e)
    final.sort(key=lambda e: e["t"])
    # no pisar los eventos de base: si ya hay uno de mayor prioridad a menos de 0,12 s, el automático se descarta
    out = list(base)
    for e in final:
        if any(abs(b["t"] - e["t"]) < 0.12 and PRIORIDAD.get(b["tipo"], 0) >= PRIORIDAD[e["tipo"]] for b in base):
            continue
        out.append(e)
    out.sort(key=lambda e: e["t"])
    base_p.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
    auto = [e for e in out if e.get("auto")]
    print(f"animaciones: {len(ev)} -> efectos automáticos: {len(auto)} + base: {len(base)} = {len(out)}")
    por_tipo = {}
    for e in out:
        por_tipo[e["tipo"]] = por_tipo.get(e["tipo"], 0) + 1
    print(por_tipo)
    # cobertura: segundos del video sin ningún efecto (rellenar solo si pasan más de 4 s)
    ts = sorted(e["t"] for e in out)
    huecos = [(round(a, 1), round(b, 1)) for a, b in zip(ts, ts[1:]) if b - a > 4]
    print("huecos > 4 s sin efecto:", huecos[:40])


if __name__ == "__main__":
    main()
