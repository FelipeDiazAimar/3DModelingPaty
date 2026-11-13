"""Sintetiza los efectos de sonido y la música de fondo del video y los deja como pistas separadas:
    film/assets/audio/sfx.mp3     efectos en cada corte, golpe, anotación y transición (cues_sfx.json)
    film/assets/audio/musica.mp3  cama musical a 128 BPM (la del grid del video), con energía por acto
    film/assets/audio/voz.mp3     silencio si todavía no hay locución (para que el render no falle); lo pisa generar_voz.py
    audio/preview_mezcla.mp3      las tres pistas juntas, para escuchar sin renderizar el video

Todo se genera con numpy/scipy (sin librerías de sonido de terceros, sin licencias). La música y los efectos
se "agachan" automáticamente cuando suena la voz (ducking calculado de audio/voz.wav, si existe).
Uso: python generar_efectos.py            # genera todo
     python generar_efectos.py --sin-musica
"""
import argparse
import json
import subprocess
import wave
from pathlib import Path

import numpy as np
from scipy import signal

AQUI = Path(__file__).resolve().parent
SALIDA = AQUI.parent / "film" / "assets" / "audio"
SR = 44100
DUR = 891.889
N = int(DUR * SR)
BPM = 128.0
BEAT = 60.0 / BPM
rng = np.random.default_rng(7)             # semilla fija: el audio sale idéntico en cada corrida


def db(x):
    return 10 ** (x / 20)


def env_exp(n, tau):
    return np.exp(-np.arange(n) / (tau * SR))


def lp(x, hz, orden=4):
    return signal.sosfilt(signal.butter(orden, hz, "low", fs=SR, output="sos"), x)


def hp(x, hz, orden=4):
    return signal.sosfilt(signal.butter(orden, hz, "high", fs=SR, output="sos"), x)


def bp(x, lo, hi, orden=3):
    return signal.sosfilt(signal.butter(orden, [lo, hi], "band", fs=SR, output="sos"), x)


def estereo(mono, ancho=0.25):
    """Pasa de mono a estéreo con una pequeña diferencia de fase entre canales (más amplio, sin cambiar el tono)."""
    d = int(0.0007 * SR)
    return np.stack([mono, np.roll(mono, d) * (1 - ancho / 2) + mono * (ancho / 2)], axis=1)


# ---------- efectos (cada uno devuelve un arreglo estéreo) ----------
def whoosh(dur=0.5):
    n = int(dur * SR)
    ruido = rng.standard_normal(n)
    # barrido: el filtro sube de 250 Hz a 5 kHz; se arma con trozos filtrados y mezclados con una ventana
    trozos, k = np.zeros(n), 10
    for i in range(k):
        c = 250 * (5000 / 250) ** (i / (k - 1))
        w = np.exp(-0.5 * ((np.linspace(0, 1, n) - i / (k - 1)) / 0.14) ** 2)
        trozos += bp(ruido, c * 0.7, min(c * 1.5, SR / 2 - 100), 2) * w
    x = trozos * np.sin(np.linspace(0, np.pi, n)) ** 2
    return estereo(x / (np.abs(x).max() + 1e-9) * 0.55, 0.6)


def hit(fuerza=1.0):
    n = int(1.6 * SR)
    t = np.arange(n) / SR
    f = 42 + 90 * np.exp(-t * 18)                              # caída de tono: golpe grave
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 3.2)
    ruido = lp(rng.standard_normal(n), 3500) * env_exp(n, 0.09)
    cola = lp(rng.standard_normal(n), 900) * env_exp(n, 0.5) * 0.25
    x = sub * 0.9 + ruido * 0.55 + cola
    x /= np.abs(x).max()
    return estereo(x * 0.85 * fuerza, 0.35)


def riser(dur=3.0):
    n = int(dur * SR)
    t = np.linspace(0, 1, n)
    tono = np.sin(2 * np.pi * np.cumsum(180 * (10 ** (t * 1.1))) / SR)  # 180 Hz -> ~2,3 kHz
    ruido = hp(rng.standard_normal(n), 1200) * t
    x = (tono * 0.35 + ruido * 0.5) * (t ** 2.2)
    return estereo(x / (np.abs(x).max() + 1e-9) * 0.5, 0.5)


def tick(suave=False):
    n = int(0.06 * SR)
    x = hp(rng.standard_normal(n), 2500) * env_exp(n, 0.006)
    x += np.sin(2 * np.pi * 1800 * np.arange(n) / SR) * env_exp(n, 0.004) * 0.5
    return estereo(x / (np.abs(x).max() + 1e-9) * (0.16 if suave else 0.3), 0.2)


def scribble(dur=1.6):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = bp(rng.standard_normal(n), 1800, 6500) * (0.55 + 0.45 * np.sin(2 * np.pi * 9 * t) ** 2)
    x *= np.sin(np.linspace(0, np.pi, n)) ** 0.6
    return estereo(x / (np.abs(x).max() + 1e-9) * 0.22, 0.4)


def glitch(dur=0.8):
    n = int(dur * SR)
    x = np.zeros(n)
    t = 0
    while t < n:
        largo = int(rng.uniform(0.012, 0.07) * SR)
        r = rng.standard_normal(largo)
        r = np.round(r * 4) / 4                                 # reducción de bits
        x[t:t + largo] = r[: max(0, min(largo, n - t))] * rng.uniform(0.2, 1.0)
        t += largo + int(rng.uniform(0.0, 0.04) * SR)
    x = hp(x, 400) * np.linspace(1, 0.2, n)
    return estereo(x / (np.abs(x).max() + 1e-9) * 0.28, 0.5)


def shatter(dur=1.4):
    n = int(dur * SR)
    x = hp(rng.standard_normal(n), 3000) * env_exp(n, 0.25) * 0.5
    for _ in range(26):                                         # esquirlas
        i = int(rng.uniform(0, 0.8) * n)
        ln = int(rng.uniform(0.01, 0.05) * SR)
        f = rng.uniform(2500, 9000)
        x[i:i + ln] += np.sin(2 * np.pi * f * np.arange(ln) / SR) * env_exp(ln, 0.012)[: len(x[i:i + ln])][:ln] * 0.4
    x += lp(rng.standard_normal(n), 700) * env_exp(n, 0.12) * 0.45
    return estereo(x / (np.abs(x).max() + 1e-9) * 0.55, 0.6)


def shimmer(dur=3.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = sum(np.sin(2 * np.pi * f * t) * a for f, a in ((880, 1), (1320, 0.6), (1760, 0.5), (2640, 0.3)))
    x *= env_exp(n, 0.9) * (1 + 0.15 * np.sin(2 * np.pi * 5 * t))
    return estereo(x / (np.abs(x).max() + 1e-9) * 0.22, 0.7)


# ---------- muestras de ElevenLabs (audio/sfx_eleven/, generar_sfx_elevenlabs.py): si existen reemplazan a la síntesis ----------
ELEVEN = AQUI / "sfx_eleven"
GANANCIA = {"hit": 0.9, "whoosh": 0.5, "riser": 0.45, "tick": 0.32, "scribble": 0.25, "glitch": 0.3, "shatter": 0.6, "shimmer": 0.28,
            "pop": 0.42, "popbig": 0.55, "swipe": 0.4, "slide": 0.38, "textin": 0.3, "grow": 0.4, "draw": 0.3, "zoomin": 0.5}
# duración máxima de cada muestra al colocarla (s); lo que no figura usa el largo que pide el evento o la muestra entera
LARGO = {"tick": 0.12, "pop": 0.35, "popbig": 0.6, "swipe": 0.45, "slide": 1.0, "textin": 0.55, "grow": 0.7, "draw": 0.7, "zoomin": 0.8}
_muestras, _uso = {}, {}


def _cargar(tipo):
    if tipo not in _muestras:
        lista = []
        for f in sorted(ELEVEN.glob(f"{tipo}_*.mp3")) if ELEVEN.exists() else []:
            r = subprocess.run(["ffmpeg", "-v", "error", "-i", str(f), "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"],
                               capture_output=True, check=True)
            x = np.frombuffer(r.stdout, dtype=np.float32).reshape(-1, 2).copy()
            lista.append(x / (np.abs(x).max() + 1e-9))
        _muestras[tipo] = lista
    return _muestras[tipo]


def desde_muestra(tipo, dur=None, fuerza=1.0, suave=False, cuerpo=1.0):
    lista = _cargar(tipo)
    if not lista:
        return None
    k = _uso.get(tipo, 0)
    _uso[tipo] = k + 1
    if tipo == "hit":                                   # los golpes fuertes usan el primero; los de menos peso, el segundo
        x = lista[0 if fuerza >= 0.75 or len(lista) == 1 else 1]
    else:
        x = lista[k % len(lista)]
    largo = LARGO.get(tipo, dur)
    if largo:
        x = x[: int(largo * SR)]
    f = min(len(x) // 3, int(0.09 * SR))                # fundido de salida: sin cortes secos
    if f > 0:
        x = x.copy()
        x[-f:] *= np.linspace(1, 0, f)[:, None]
    g = GANANCIA[tipo] * (0.5 if suave else 1.0) * (fuerza if tipo == "hit" else 1.0) * cuerpo
    return (x * g).astype(np.float32)



def ambiente(dur):
    """Cama de ruido de planta: las muestras de ElevenLabs en bucle con fundido cruzado, a bajo nivel."""
    lista = _cargar("ambiente")
    if not lista:
        return None
    n, fund = int(dur * SR), int(1.0 * SR)
    out = np.zeros((n, 2), dtype=np.float32)
    pos, k = 0, _uso.get("amb", 0)
    while pos < n:
        x = lista[k % len(lista)].copy()
        k += 1
        f = min(fund, len(x) // 4)
        x[:f] *= np.linspace(0, 1, f)[:, None]
        x[-f:] *= np.linspace(1, 0, f)[:, None]
        m = min(len(x), n - pos)
        out[pos:pos + m] += x[:m]
        pos += len(x) - f
    _uso["amb"] = k
    fi = min(int(0.8 * SR), n // 3)
    out[:fi] *= np.linspace(0, 1, fi)[:, None]
    out[-fi:] *= np.linspace(1, 0, fi)[:, None]
    return (out * 0.20).astype(np.float32)

GENERADORES = {"whoosh": whoosh, "hit": hit, "riser": riser, "tick": tick, "scribble": scribble, "glitch": glitch,
               "shatter": shatter, "shimmer": shimmer,
               # sin muestras de ElevenLabs, los tipos nuevos usan la síntesis local más parecida
               "pop": lambda **k: tick(), "popbig": lambda **k: hit(0.35), "swipe": lambda **k: whoosh(0.3),
               "slide": lambda **k: whoosh(0.8), "textin": lambda **k: tick(True), "grow": lambda **k: riser(0.5),
               "draw": lambda **k: scribble(0.6), "zoomin": lambda **k: whoosh(0.6)}


def pista_sfx():
    pista = np.zeros((N + SR * 4, 2), dtype=np.float32)
    eventos = json.loads((AQUI / "cues_sfx.json").read_text(encoding="utf-8"))
    for e in eventos:
        if e["tipo"] == "ambiente":
            x = ambiente(e["dur"])
            if x is not None:
                i = int(e["t"] * SR)
                pista[i:i + len(x)] += x[: len(pista) - i]
            continue
        args = {k: v for k, v in e.items() if k not in ("t", "tipo", "auto")}
        x = desde_muestra(e["tipo"], **args)
        if x is None:
            x = GENERADORES[e["tipo"]](**{k: v for k, v in args.items() if k not in ("cuerpo",)})
        i = int(e["t"] * SR)
        if e["tipo"] in ("whoosh", "riser"):                    # estos terminan en el corte: arrancan antes
            i = max(0, i - len(x) + int(0.05 * SR))
        i = max(0, i)
        pista[i:i + len(x)] += x[: len(pista) - i]
    return pista[:N]


# ---------- música ----------
def nota(f, n, amp=1.0, detune=0.004):
    t = np.arange(n) / SR
    x = sum(signal.sawtooth(2 * np.pi * f * (1 + d) * t) for d in (-detune, 0, detune)) / 3
    return x * amp


def pista_musica():
    barra = 4 * BEAT
    acordes = [(55.0, (220.0, 261.63, 329.63)),     # Am
               (43.65, (174.61, 220.0, 261.63)),    # F
               (65.41, (196.0, 261.63, 329.63)),    # C
               (49.0, (196.0, 246.94, 293.66))]     # G
    pad = np.zeros(N)
    largo = int(2 * barra * SR)
    k = 0
    while k * largo < N:
        raiz, notas = acordes[k % 4]
        n = min(largo + int(0.6 * SR), N - k * largo)
        seg = sum(nota(f, n, 0.33) for f in notas) + nota(raiz, n, 0.7, 0.002)
        seg = lp(seg, 1100, 2)
        a = min(int(0.5 * SR), n // 2)
        seg[:a] *= np.linspace(0, 1, a)
        seg[-a:] *= np.linspace(1, 0, a)
        pad[k * largo:k * largo + n] += seg
        k += 1
    # pulso: bombo en cada tiempo y hi-hat a contratiempo
    pulso = np.zeros(N)
    bombo = np.sin(2 * np.pi * np.cumsum(48 + 110 * np.exp(-np.arange(int(0.25 * SR)) / (0.025 * SR))) / SR) * env_exp(int(0.25 * SR), 0.09)
    hat = hp(rng.standard_normal(int(0.05 * SR)), 7000) * env_exp(int(0.05 * SR), 0.008) * 0.35
    b = 0
    while b * BEAT < DUR:
        i = int(b * BEAT * SR)
        pulso[i:i + len(bombo)] += bombo[: N - i]
        j = int((b + 0.5) * BEAT * SR)
        if j + len(hat) < N:
            pulso[j:j + len(hat)] += hat
        b += 1
    # automatización por acto (en dB), interpolada
    #           t(s)   pad   pulso
    puntos = [(0, -15, -200), (7.4, -15, -200), (7.5, -13, -13), (25.7, -15, -17), (25.8, -20, -200),
              (474.589, -20, -200), (474.689, -26, -200), (850.989, -26, -200), (851.089, -17, -15),
              (884.789, -17, -15), (884.889, -13, -13), (DUR - 2.5, -15, -17), (DUR, -60, -60)]
    tt = np.arange(N) / SR
    g_pad = db(np.interp(tt, [p[0] for p in puntos], [p[1] for p in puntos]))
    g_pul = db(np.interp(tt, [p[0] for p in puntos], [p[2] for p in puntos]))
    # normalización
    pad = pad / (np.abs(pad).max() + 1e-9)
    pulso = pulso / (np.abs(pulso).max() + 1e-9)
    mono = pad * g_pad + pulso * g_pul
    return np.stack([mono, np.roll(mono, int(0.0004 * SR))], axis=1).astype(np.float32)


def ducking(estereo_in, profundidad):
    """Baja el volumen donde suena la voz (envolvente de audio/voz.wav, ataque rápido, soltada lenta)."""
    wav = AQUI / "voz.wav"
    if not wav.exists():
        return estereo_in
    with wave.open(str(wav), "rb") as w:
        v = np.frombuffer(w.readframes(w.getnframes()), dtype="<i2").astype(np.float32) / 32768
    v = np.pad(v, (0, max(0, N - len(v))))[:N]
    env = lp(np.abs(v), 12, 1)
    env = np.clip(env / (np.percentile(env, 98) + 1e-9), 0, 1)
    atk = signal.lfilter([1 - np.exp(-1 / (0.04 * SR))], [1, -np.exp(-1 / (0.04 * SR))], env)
    ganancia = 1 - profundidad * atk
    return (estereo_in * ganancia[:, None]).astype(np.float32)


def a_wav(p, x):
    x = np.clip(x, -1, 1)
    with wave.open(str(p), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype("<i2").tobytes())


def a_mp3(wav, mp3, vol=1.0):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(wav), "-filter:a", f"volume={vol}", "-b:a", "192k", str(mp3)], check=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sin-musica", action="store_true")
    a = ap.parse_args()
    SALIDA.mkdir(parents=True, exist_ok=True)
    tmp = AQUI / "tmp"
    tmp.mkdir(exist_ok=True)

    sfx = ducking(pista_sfx(), 0.30)
    a_wav(tmp / "sfx.wav", sfx / max(1.0, float(np.abs(sfx).max()) / 0.9))
    a_mp3(tmp / "sfx.wav", SALIDA / "sfx.mp3")
    print("sfx.mp3 listo")
    if not a.sin_musica:
        mus = ducking(pista_musica(), 0.55)
        a_wav(tmp / "musica.wav", mus / max(1.0, float(np.abs(mus).max()) / 0.9))
        a_mp3(tmp / "musica.wav", SALIDA / "musica.mp3")
        print("musica.mp3 listo")
    voz = SALIDA / "voz.mp3"
    if not voz.exists():
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", f"anullsrc=r={SR}:cl=mono", "-t", str(DUR),
                        "-b:a", "64k", str(voz)], check=True)
        print("voz.mp3 (silencio de reserva) listo")
    # preview con las tres pistas
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(SALIDA / "musica.mp3"), "-i", str(SALIDA / "sfx.mp3"),
                    "-i", str(voz), "-filter_complex", "[0][1][2]amix=inputs=3:normalize=0:duration=longest[o]",
                    "-map", "[o]", "-b:a", "160k", str(AQUI / "preview_mezcla.mp3")], check=True)
    print("preview_mezcla.mp3 listo")


if __name__ == "__main__":
    main()
