"""Genera la locución con Fish Audio y arma la pista de voz del video (film/assets/audio/voz.mp3).

Configuración (variables de entorno o un archivo audio/.env, que git ignora):
    FISH_API_KEY    clave de la API (obligatoria salvo con --seco)
    FISH_VOICE_ID   reference_id de la voz elegida en fish.audio (recomendado: una voz en español rioplatense)
    FISH_MODEL      s2.1-pro (por defecto), s2.1-pro-free, s2-pro, s1 o drama-3
    FISH_SPEED      velocidad base de prosody.speed, 1.0 por defecto

Uso:
    python generar_voz.py --seco            # no llama a la API: estima si cada texto entra en su ventana
    python generar_voz.py                   # genera la voz IA (grupo "ia": actos 1-5 y 7)
    python generar_voz.py --acto6           # además genera la voz de reserva del Acto 6 (la del equipo es la oficial)
    python generar_voz.py --solo "D26 qué es un MCP" "D27 no existía"    # regenera solo esos cues
Cada cue se guarda en audio/voz_cache/ (clave = texto + voz + modelo + velocidad), así que repetir no gasta créditos.
Cada cue se coloca en su ventana de cues_voz.json; si dura más que la ventana se acelera hasta MAX_TEMPO y,
si aun así no entra, queda marcado en informe_voz.txt para acortar el texto o mover el video.
"""
import argparse
import hashlib
import json
import os
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np

AQUI = Path(__file__).resolve().parent
FILM = AQUI.parent / "film"
SALIDA = FILM / "assets" / "audio"
CACHE = AQUI / "voz_cache"
SR = 44100
SANGRIA = 0.25        # la voz entra 0,25 s después del inicio de la diapositiva
COLA = 0.25           # y debe terminar 0,25 s antes de que termine
MAX_TEMPO = 1.30      # aceleración máxima por ffmpeg atempo (más se nota artificial)
CPS_SECO = 14.5       # caracteres por segundo de una locución natural en español, para el modo --seco


def cargar_env():
    f = AQUI / ".env"
    if f.exists():
        for l in f.read_text(encoding="utf-8").splitlines():
            if "=" in l and not l.strip().startswith("#"):
                k, v = l.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def fish_tts(texto, clave, voz, modelo, velocidad, destino):
    import requests
    cuerpo = {"text": texto, "format": "mp3", "sample_rate": 44100, "normalize": True, "latency": "normal",
              "prosody": {"speed": velocidad}, "temperature": 0.7, "top_p": 0.7}
    if voz:
        cuerpo["reference_id"] = voz
    r = requests.post("https://api.fish.audio/v1/tts", json=cuerpo, timeout=180,
                      headers={"Authorization": f"Bearer {clave}", "Content-Type": "application/json", "model": modelo})
    if r.status_code != 200:
        raise RuntimeError(f"Fish Audio {r.status_code}: {r.text[:300]}")
    destino.write_bytes(r.content)


def duracion(p):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)],
                       capture_output=True, text=True, check=True)
    return float(r.stdout.strip())


def a_pcm(p, tempo=1.0):
    """Decodifica a mono 44,1 kHz float32 con ffmpeg (acelerando si hace falta)."""
    filtro = [] if abs(tempo - 1) < 1e-3 else ["-filter:a", f"atempo={tempo:.4f}"]
    r = subprocess.run(["ffmpeg", "-v", "error", "-i", str(p), *filtro, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                       capture_output=True, check=True)
    return np.frombuffer(r.stdout, dtype=np.float32)


def escribir_wav(p, x):
    x = np.clip(x, -1, 1)
    with wave.open(str(p), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype("<i2").tobytes())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--seco", action="store_true", help="no llama a la API; estima los tiempos")
    ap.add_argument("--acto6", action="store_true", help="incluye la voz de reserva del Acto 6")
    ap.add_argument("--solo", nargs="*", help="ids de cues a regenerar (el resto sale del caché)")
    a = ap.parse_args()
    cargar_env()
    cues = [c for c in json.loads((AQUI / "cues_voz.json").read_text(encoding="utf-8"))
            if c["activo"] or (a.acto6 and c["grupo"] == "acto6")]
    clave, voz = os.environ.get("FISH_API_KEY"), os.environ.get("FISH_VOICE_ID")
    modelo, vel = os.environ.get("FISH_MODEL", "s2.1-pro"), float(os.environ.get("FISH_SPEED", "1.0"))
    if not a.seco and not clave:
        sys.exit("Falta FISH_API_KEY (variable de entorno o audio/.env). Con --seco se puede probar sin clave.")
    if not a.seco and not voz:
        print("AVISO: sin FISH_VOICE_ID Fish usa su voz por defecto: elegí una voz en español y poné su reference_id.")
    CACHE.mkdir(exist_ok=True)
    SALIDA.mkdir(parents=True, exist_ok=True)

    total = int((891.889 + 1) * SR)
    pista = np.zeros(total, dtype=np.float32)
    informe = []
    for c in cues:
        ventana = c["fin"] - c["inicio"] - SANGRIA - COLA
        if a.seco:
            dur = len(c["texto"]) / CPS_SECO
            tempo = max(1.0, dur / ventana)
            ok = tempo <= MAX_TEMPO
            informe.append((ok, c["id"], c["inicio"], dur, ventana, tempo, len(c["texto"])))
            continue
        h = hashlib.sha1(f"{c['texto']}|{voz}|{modelo}|{vel}".encode("utf-8")).hexdigest()[:16]
        f = CACHE / f"{h}.mp3"
        if not f.exists() or (a.solo and c["id"] in a.solo):
            print(f"Fish Audio: {c['id']}…", flush=True)
            fish_tts(c["texto"], clave, voz, modelo, vel, f)
        dur = duracion(f)
        tempo = max(1.0, dur / ventana)
        ok = tempo <= MAX_TEMPO
        x = a_pcm(f, min(tempo, MAX_TEMPO))
        i0 = int((c["inicio"] + SANGRIA) * SR)
        n = min(len(x), total - i0)
        pista[i0:i0 + n] += x[:n]
        informe.append((ok, c["id"], c["inicio"], dur, ventana, tempo, len(c["texto"])))

    lineas = [f"{'OK ' if ok else 'LARGO'}  {i:30s} inicio {ini:7.1f}s  voz {d:5.1f}s  ventana {v:5.1f}s  "
              f"tempo x{t:4.2f}  {n} caracteres" for ok, i, ini, d, v, t, n in informe]
    largos = [x for x in informe if not x[0]]
    cab = [f"Informe de voz ({'estimado, sin API' if a.seco else 'real'}): {len(informe)} cues, {len(largos)} no entran "
           f"ni a x{MAX_TEMPO}. Acortar el texto en guiones/guion_ia.md (y volver a correr cues.py) o alargar la diapositiva.", ""]
    (AQUI / ("informe_voz_seco.txt" if a.seco else "informe_voz.txt")).write_text("\n".join(cab + lineas), encoding="utf-8")
    print("\n".join(cab + [l for l in lineas if l.startswith("LARGO") or a.seco and "x1.0" not in l][:60]))
    if a.seco:
        return
    # Audios grabados por el equipo (equipo_clips.json, lo arma el script de montaje): se suman a la misma pista para que el ducking de la música los respete
    eq = AQUI / "equipo_clips.json"
    if eq.exists():
        for c in json.loads(eq.read_text(encoding="utf-8")):
            filtro = f"highpass=f=75,volume={c['gain_db']}dB"
            if abs(c["tempo"] - 1) > 1e-3:
                filtro += f",atempo={c['tempo']}"
            filtro += ",alimiter=limit=0.9"
            r = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{max(0, c['a'] - 0.15):.3f}", "-t", f"{c['b'] - c['a'] + 0.5:.3f}", "-i", str(AQUI / c["src"]), "-af", filtro,
                                "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True)
            x = np.frombuffer(r.stdout, dtype=np.float32).copy()
            fi = int(0.03 * SR)
            x[:fi] *= np.linspace(0, 1, fi)
            x[-fi:] *= np.linspace(1, 0, fi)
            i0 = int((c["t"] - 0.15 / c["tempo"]) * SR)
            n = min(len(x), total - i0)
            pista[i0:i0 + n] += x[:n]
        print("Audios del equipo mezclados:", len(json.loads(eq.read_text(encoding="utf-8"))))
    pico = float(np.abs(pista).max()) or 1.0
    pista *= min(1.0, 0.89 / pico)
    escribir_wav(AQUI / "voz.wav", pista)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(AQUI / "voz.wav"), "-b:a", "192k", str(SALIDA / "voz.mp3")], check=True)
    print(f"Pista de voz escrita: {SALIDA / 'voz.mp3'}")


if __name__ == "__main__":
    main()
