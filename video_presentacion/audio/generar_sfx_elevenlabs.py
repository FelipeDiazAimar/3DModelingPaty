"""Genera con ElevenLabs (text-to-sound-effects) las muestras de efectos que usa generar_efectos.py.

Config: ELEVENLABS_API_KEY en audio/.env (git lo ignora).
Uso: python generar_sfx_elevenlabs.py            # genera las que faltan en audio/sfx_eleven/
     python generar_sfx_elevenlabs.py --rehacer  # vuelve a generar todas (gasta créditos)
Después: python generar_efectos.py (usa estas muestras en lugar de la síntesis local, si existen).
Endpoint: POST https://api.elevenlabs.io/v1/sound-generation (text, duration_seconds 0,5 a 30, prompt_influence).
"""
import argparse
import os
from pathlib import Path

import requests

AQUI = Path(__file__).resolve().parent
DEST = AQUI / "sfx_eleven"

# nombre de archivo -> (prompt, duración en s). El tipo es lo que va antes del guion bajo.
MUESTRAS = {
    "hit_1": ("deep cinematic bass impact hit with short reverb tail, trailer style, punchy", 1.6),
    "hit_2": ("heavy sub boom thud, single powerful hit, tight and clean, cinematic", 1.4),
    "whoosh_1": ("fast clean cinematic whoosh transition, air swish, no music", 0.9),
    "whoosh_2": ("smooth swoosh passing by with slightly rising pitch, short, no music", 0.9),
    "whoosh_3": ("soft quick swish transition, subtle, no music", 0.7),
    "riser_1": ("cinematic tension riser building up with rising noise sweep, ends abruptly, no music", 5.0),
    "tick_1": ("single mechanical split-flap display click, very short, dry", 0.5),
    "tick_2": ("single small plastic button click, very short, crisp", 0.5),
    "scribble_1": ("marker pen scribbling quickly on paper, highlighting, no voice", 1.6),
    "glitch_1": ("digital glitch stutter, electronic data corruption transition, short", 1.0),
    "shatter_1": ("glass shattering into many pieces with debris falling, cinematic", 1.6),
    # --- tanda 2: apariciones y movimientos de objetos (UI y motion graphics) ---
    "pop_1": ("soft bubble pop, UI element appearing, short and clean, no music", 0.5),
    "pop_2": ("light rounded pop with tiny sparkle, card appearing on screen, short", 0.5),
    "pop_3": ("small crisp pop, notification badge appearing, very short", 0.5),
    "popbig_1": ("bigger satisfying pop with soft air swoosh, large panel appearing, short", 0.7),
    "swipe_1": ("quick soft UI swipe slide sound, short, clean, no music", 0.5),
    "swipe_2": ("light fabric-like swish, element sliding into place, short", 0.5),
    "swipe_3": ("fast sleek slide whoosh sideways, short, no music", 0.5),
    "slide_1": ("long smooth gliding sweep, panel sliding across the screen, soft, no music", 1.2),
    "slide_2": ("slow airy sweep with gentle rise, object moving across, no music", 1.4),
    "textin_1": ("soft digital text appearing blip sequence, light keyboard-like ticks, short", 0.8),
    "textin_2": ("quick subtle typing burst on a mechanical keyboard, short, no voice", 0.8),
    "roll_1": ("slot machine reel quickly clicking and stopping, mechanical, short", 1.0),
    "grow_1": ("short rising synth sweep, bar chart growing, upbeat, no music", 0.8),
    "grow_2": ("quick ascending whoosh with soft bloom, progress bar filling, short", 0.8),
    "thud_1": ("soft thud of a heavy object landing on a table, short, dry", 0.6),
    "thud_2": ("muffled wooden knock landing, element snapping into place, short", 0.5),
    "sparkle_1": ("tiny bright sparkle chime, short magic twinkle", 0.9),
    "click_1": ("soft mouse click, UI button press, very short, dry", 0.5),
    "click_2": ("crisp trackpad tap click, very short", 0.5),
    "zoomin_1": ("camera zoom in whoosh with deep swoosh, fast, cinematic, no music", 0.8),
    "zoomout_1": ("camera zoom out whoosh reverse swoosh, fast, cinematic, no music", 0.8),
    "wipe_1": ("paper-like wipe swipe across the screen, sheer, short, no music", 0.6),
    "ding_1": ("positive soft notification ding, short, clean, no music", 0.8),
    "stamp_1": ("rubber stamp thump on paper, short, punchy", 0.5),
    "draw_1": ("pen drawing a line quickly on paper, short stroke, no voice", 0.7),
    "conveyor_1": ("short factory conveyor belt starting up with soft mechanical hum, no voice", 1.5),
    "machine_1": ("industrial machine powering on with a short clunk and hum, no voice", 1.5),
    "beep_1": ("single forklift reversing beep, short", 0.5),
    # --- ambiente de planta (se coloca bajo las tomas de FlexSim, Blender y la web) ---
    "ambiente_1": ("food processing factory ambience, steady distant industrial machinery hum with soft conveyor belt noise, no voice, no music", 30.0),
    "ambiente_2": ("cold storage warehouse ambience, refrigeration compressors humming, soft air vents, occasional forklift in the distance, no voice, no music", 30.0),
    "shimmer_1": ("magical shimmering sparkle chime, logo reveal, bright and airy tail", 3.0),
}


def cargar_env():
    f = AQUI / ".env"
    if f.exists():
        for l in f.read_text(encoding="utf-8").splitlines():
            if "=" in l and not l.strip().startswith("#"):
                k, v = l.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--rehacer", action="store_true")
    a = ap.parse_args()
    cargar_env()
    clave = os.environ.get("ELEVENLABS_API_KEY")
    if not clave:
        raise SystemExit("Falta ELEVENLABS_API_KEY en audio/.env")
    DEST.mkdir(exist_ok=True)
    for nombre, (prompt, dur) in MUESTRAS.items():
        f = DEST / f"{nombre}.mp3"
        if f.exists() and not a.rehacer:
            continue
        r = requests.post("https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128", timeout=180,
                          headers={"xi-api-key": clave, "Content-Type": "application/json"},
                          json={"text": prompt, "duration_seconds": dur, "prompt_influence": 0.5, "loop": nombre.startswith("ambiente")})
        if r.status_code != 200:
            raise SystemExit(f"ElevenLabs {r.status_code} en {nombre}: {r.text[:300]}")
        f.write_bytes(r.content)
        print("ok", nombre)


if __name__ == "__main__":
    main()
