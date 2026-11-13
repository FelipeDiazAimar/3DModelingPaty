"""Arma las pistas de cue del video (voz y efectos) a partir del proyecto, sin duplicar tiempos a mano.

Fuentes (todo se lee de los archivos reales, así que si el video cambia se vuelve a correr y listo):
  - film/compositions/s99-subs.html     -> inicio de cada diapositiva (DIAPOS)
  - guiones/guion_ia.md                 -> texto de la locución IA
  - film/compositions/s06-karaoke.html  -> frases de la toma de FlexSim (Acto 3)
  - film/compositions/s08-web.html      -> subtítulos de la web (Acto 5)
  - film/compositions/s09-acto6.html    -> karaoke del equipo y subtítulos de las corridas (Acto 6)
  - film/index.html                     -> clips (anotaciones, transiciones)

Salida: cues_voz.json y cues_sfx.json (editables a mano; los scripts siguientes solo leen esos JSON).
Uso: python cues.py
"""
import json
import re
from pathlib import Path

AQUI = Path(__file__).resolve().parent
RAIZ = AQUI.parent                      # video_presentacion/
FILM = RAIZ / "film"
COMP = FILM / "compositions"

DUR_VIDEO = 891.889                  # data-duration del root de index.html
S09 = 474.689                        # inicio de s09-acto6 (se corrió 12,42 s al alargar la toma de la web y quitar el negro final)


def leer(p):
    return Path(p).read_text(encoding="utf-8")


def diapos():
    s = leer(COMP / "s99-subs.html")
    m = re.search(r"const DIAPOS = (\[\[.*?\]\]);", s, re.S)
    return {n: t for n, t in json.loads(m.group(1))}


def guion_ia():
    filas = {}
    for linea in leer(RAIZ / "guiones" / "guion_ia.md").splitlines():
        if not linea.startswith("|") or linea.startswith("|--") or "Texto locución" in linea:
            continue
        c = [x.strip() for x in linea.strip().strip("|").split("|")]
        if len(c) >= 4 and c[3] == "HABLA":
            filas[c[0]] = c[2]
    return filas


# (fila del guion, diapositiva donde empieza, diapositiva donde termina la ventana)
# Verificado contra los tiempos del guion en pulsos (128 BPM): las duraciones coinciden con cada ventana.
SLOTS = [
    ("D2 portada", 2, 3), ("Rubro", 7, 8), ("D8 sistema", 8, 9), ("D7 problema", 9, 10), ("D9 nave", 10, 11),
    ("D10–D12 escala", 11, 14), ("Escenario base", 14, 15), ("D13 sospechosa", 15, 16), ("D14 evidencia", 16, 17),
    ("D15 por qué la formadora", 17, 18), ("D16 cómo", 18, 19), ("D16–D17 referencia", 19, 21),
    ("D19 por dónde arrancamos", 21, 22), ("D20 planos", 22, 23), ("D19 Blender", 23, 24), ("D20 código", 24, 25),
    ("D24 conclusiones", 26, 27), ("D25 necesidad", 27, 28), ("D26 qué es un MCP", 28, 29), ("D27 no existía", 29, 30),
    ("D28 el puente", 30, 31), ("D31 idea de la web", 33, 34),
    ("D40 conclusiones", 44, 45), ("D41 cierre", 45, 46),
]

# tramos donde se ve la planta (Blender, tablero de FlexSim, web y los tres videos de las corridas)
AMBIENTE = []  # sin ambiente de planta: bajo las tomas de FlexSim y la web se oía como el ventilador de la PC

# Corrimiento que s09-acto6.html aplica con tl.shiftChildren al insertar los videos de las corridas.
GAPS = [(163.0, 32.9), (210.1, 34.1), (251.2, 34.1)]


def _wk():
    s = leer(COMP / "s09-acto6.html")
    blk = re.search(r"const WK = \[(.*?)\];", s, re.S).group(1)
    return [tuple(float(x) for x in p) for p in re.findall(r"\[([\d.]+),([\d.]+)\]", blk)]


WK = _wk()


def warp(t):
    """Misma función W que s09-acto6.html (interpolación lineal por tramos)."""
    if t <= WK[0][0]:
        return t
    if t >= WK[-1][0]:
        return WK[-1][1] + t - WK[-1][0]
    for (a0, b0), (a1, b1) in zip(WK, WK[1:]):
        if t <= a1:
            return b1 if a1 == a0 else b0 + (t - a0) * (b1 - b0) / (a1 - a0)
    return t


def corrido(t):
    return t + sum(d for a, d in GAPS if t >= a)


def segs_karaoke(archivo, host, corregir=False):
    s = leer(COMP / archivo)
    m = re.search(r"const SEGS_RAW = \[(.*?\]\s*)\]\s*;", s, re.S) or re.search(r"const SEGS = \[(.*?)\]\s*\.map", s, re.S)
    out = []
    for a, b, txt in re.findall(r'\[\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*"(.*?)"\s*\]', m.group(1), re.S):
        a, b = float(a), float(b)
        if corregir:
            a, b = warp(corrido(a)), warp(corrido(b))
        out.append((host + a, host + b, txt))
    return out


def segs_s08():
    s = leer(COMP / "s08-web.html")
    out = []
    for a, b, t in re.findall(r'^\s*sub\(([\d.]+),\s*([\d.]+),\s*"(.*?)"\);', s, re.M):
        out.append((333.323 + float(a), 333.323 + float(b), t))
    return sorted(out)


def vsubs_acto6():
    s = leer(COMP / "s09-acto6.html")
    out = []
    for a, b, t in re.findall(r'^\s*vsub\(([\d.]+),\s*([\d.]+),\s*"(.*?)"\);', s, re.M):
        out.append((S09 + warp(float(a)), S09 + warp(float(b)), t))
    return sorted(out)


def cues_voz():
    d, g = diapos(), guion_ia()
    aj = AQUI / "ajustes_texto.json"
    g.update({k: v for k, v in json.loads(leer(aj)).items() if not k.startswith("_")} if aj.exists() else {})
    cues = []

    def add(id_, grupo, ini, fin, texto, activo=True):
        cues.append({"id": id_, "grupo": grupo, "inicio": round(ini, 3), "fin": round(fin, 3),
                     "texto": texto, "activo": activo})

    for fila, a, b in SLOTS:
        if fila not in g:
            raise SystemExit(f"Falta la fila '{fila}' en guion_ia.md")
        add(fila, "ia", d[a], d[b], g[fila])

    # Acto 4 (MCP): la IA recorre las categorías de herramientas a medida que aparecen en pantalla (panel de 285,5 s a 308 s)
    add("D29 herramientas a", "ia", d[31] + 0.1, d[31] + 3.6, "Setenta y tres herramientas, en ocho categorías.")
    add("D29 herramientas b", "ia", d[31] + 3.7, d[31] + 9.5, "Catorce son del ciclo de vida y la corrida del modelo, y doce de FlexScript y nodos.")
    add("D29 herramientas c", "ia", d[31] + 9.7, d[31] + 15.3, "Once para construir el modelo, diez para tablas y experimentos y siete para dashboards y cámara.")
    add("D29 herramientas d", "ia", d[31] + 15.5, d[31] + 22.0, "Y tres más: ProcessFlow, AGV y fluidos. Con todo eso, la IA crea máquinas, las conecta y corre réplicas sola.")
    add("D27 GitHub", "ia", d[29] + 6.0, d[29] + 9.0, "Quedó subido a GitHub.")

    # Acto 3: una frase por hoja del tablero (el karaoke de la toma de FlexSim)
    for i, (a, b, t) in enumerate(segs_karaoke("s06-karaoke.html", 164.533333)):
        add(f"D21 hoja {i + 1}", "equipo", a, b, t, activo=False)

    # Acto 5 (web): las 4 frases de la cinemática son subtítulos largos de la toma; cada apartado usa su fila del guion
    # en la ventana de su chip (los subtítulos cortos de 1,5 a 2,7 s de cada apartado son rótulos, no locución).
    for i, (a, b, t) in enumerate(x for x in segs_s08() if x[1] - x[0] >= 5):
        add(f"web cinemática {i + 1}", "equipo", a, b, t, activo=False)
    w = leer(COMP / "s08-web.html")
    chips = [(c, float(t)) for c, t in re.findall(r'^\s*chip\("(#w8-c-[a-z]+)",\s*([\d.]+)\);', w, re.M)]
    filas_web = {"prod": "D31 Producción", "par": "D31 Paradas", "col": "D31 Colas y WIP", "vel": "D31 Velocidad",
                 "mas": "D31 Balance de masa", "flo": "D31 Montacargas", "est": "D31 Estadística", "esc": "D31 Escenarios"}
    fin_escena = 333.323 + 141.365
    for i, (c, t) in enumerate(chips):
        clave = c.split("-")[-1]
        if clave not in filas_web:
            continue
        ini = 333.323 + t
        fin = 333.323 + chips[i + 1][1] if i + 1 < len(chips) else fin_escena
        add(filas_web[clave], "equipo", ini, fin, g[filas_web[clave]], activo=False)

    # Acto 6: voz del equipo (pista muda con karaoke). Se genera solo con --acto6 (voz de reserva).
    for i, (a, b, t) in enumerate(segs_karaoke("s09-acto6.html", S09, corregir=True)):
        add(f"A6 karaoke {i + 1:02d}", "ia", a, b, t)
    for i, (a, b, t) in enumerate(vsubs_acto6()):
        add(f"A6 video {i + 1:02d}", "equipo", a, b, t, activo=False)

    # Reparto de voz: la IA habla en las diapositivas y se calla durante las grabaciones de las corridas;
    # el equipo dice la toma de FlexSim, la web y las diapositivas de las corridas E2 a E4 (diapositivas 39 a 41),
    # y las diapositivas de conclusiones (la de la simulación, 26, y las generales, 44). Desde la 42 vuelve la IA, y después de las conclusiones hace el cierre.
    d39, d42 = d[39], d[42]
    FALTAN = {f"A6 karaoke {k}" for k in range(18, 25)} | {f"A6 video {k:02d}" for k in range(1, 6)}

    def del_equipo(c):
        i = c["id"]
        # Sin audio del equipo todavía (faltan E2 y el arranque de E3): suena la voz de la IA hasta que lo graben.
        if i in FALTAN:
            return False
        if i.startswith(("D21 hoja", "D24 conclusiones", "web cinemática", "D40 conclusiones")):
            return True
        if i.startswith("D31 ") and i != "D31 idea de la web":
            return True
        if i.startswith("A6 "):
            return d39 - 0.01 <= c["inicio"] < d42 - 0.01
        return False
    for c in cues:
        eq = del_equipo(c)
        c["grupo"], c["activo"] = ("equipo", False) if eq else ("ia", True)

    cues.sort(key=lambda c: c["inicio"])
    return cues


def cues_sfx():
    d = diapos()
    ev = []

    def add(t, tipo, **kw):
        ev.append({"t": round(t, 3), "tipo": tipo, **kw})

    # Chispa (diapo 1): subida hasta el corte a la portada
    add(0.4, "riser", dur=7.0)
    # Portada y muro de integrantes
    add(d[2], "hit", fuerza=1.0)
    for n in (3, 4, 5):
        add(d[n], "whoosh", dur=0.45)
    add(24.366667, "shatter", dur=1.4)       # mk-clone-wall-transition
    add(d[7], "whoosh", dur=0.5)
    # Problema: el título golpea
    add(d[9] - 0.3, "riser", dur=0.3)
    add(d[9], "hit", fuerza=0.8)
    for n in range(10, 14):
        add(d[n], "tick")
    # Pixelado hacia la variable y tablero de letras que se dan vuelta
    add(119.633333, "glitch", dur=0.8)
    for i in range(15):
        add(123.766667 + 0.25 + i * 0.06, "tick", suave=True)
        add(123.766667 + 0.25 + i * 0.06 + 0.5, "tick", suave=True)
    # Cambios de diapositiva (resto)
    saltear = {1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 20}
    for n, t in sorted(d.items()):
        if n in saltear:
            continue
        add(t, "whoosh", dur=0.55)
    # Cuatro momentos de más peso: toma de FlexSim, MCP, web y cierre
    for n in (25, 27, 34, 35):
        add(d[n], "hit", fuerza=0.55)
    # Anotaciones (marcador a mano) y videos de las corridas
    idx = leer(FILM / "index.html")
    for m in re.finditer(r'<div\s+id="(ann-[^"]+)"(.*?)></div>', idx, re.S):
        st = re.search(r'data-start="([\d.]+)"', m.group(2))
        if st:
            add(float(st.group(1)), "scribble", dur=1.6)
    for local in (163.0, 243.0, 318.2):          # entrada de cada video de corrida (E2, E3, E4)
        add(S09 + warp(local), "whoosh", dur=0.5)
    # Ambiente de planta bajo las tomas de FlexSim, Blender y la web (rangos de index.html; ver README)
    for a, b in AMBIENTE:
        add(a, "ambiente", dur=round(b - a, 3))
    # Cierre
    add(d[44], "hit", fuerza=0.7)
    add(d[46], "hit", fuerza=1.0)
    add(d[46] + 0.15, "shimmer", dur=3.0)
    ev.sort(key=lambda e: e["t"])
    return ev


if __name__ == "__main__":
    v, s = cues_voz(), cues_sfx()
    (AQUI / "cues_voz.json").write_text(json.dumps(v, ensure_ascii=False, indent=1), encoding="utf-8")
    (AQUI / "cues_sfx.json").write_text(json.dumps(s, ensure_ascii=False, indent=1), encoding="utf-8")
    act = [c for c in v if c["activo"]]
    print(f"voz: {len(v)} cues ({len(act)} activos, {len(v) - len(act)} del equipo) · efectos: {len(s)}")
