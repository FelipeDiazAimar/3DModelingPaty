#!/usr/bin/env python3
"""Arma linea3_E4_v1.fsm (piloto E4 L3) via MCP y lo corre 600 s.

Supuestos documentados (ver PREGUNTAS_PENDIENTES.md):
- Molde F26: 4 cavidades x 69 g = 276 g/golpe; ~57 golpes/min -> PT 0.26 s/burger.
- Mezcladora: batch 1500 kg / 20 min -> Processor PT 1200 s (flujo continuo
  aproximado, sin lógica de batch discreto en v1).
- Picadora PT 1.5 s; estuchadora/envasadora 0.4 s (150/min).
- L3A/L3B: dos sub-líneas simétricas con descarga directa (sin carritos).
"""
import asyncio
import subprocess
import sys
import time
from pathlib import Path

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

REPO = Path(r"C:\Users\Asus\Desktop\Facultad\APUNTES CUARTO ANO\Simulacion\mcp_flexsim_opencode")
MODEL = Path(r"C:\Users\Asus\Desktop\Facultad\APUNTES CUARTO ANO\Simulacion\FabricaPaty_SanJorge\linea3_E4_v1.fsm")


async def main() -> int:
    MODEL.unlink(missing_ok=True)
    params = StdioServerParameters(command="uv", args=["--directory", str(REPO), "run", "mcp_server/flexsim_mcp.py"])
    async with stdio_client(params) as (read, write):
        async with ClientSession(read, write) as s:
            await s.initialize()

            async def call(tool, args=None):
                r = await s.call_tool(tool, args or {})
                return " | ".join(c.text for c in r.content if hasattr(c, "text"))

            async def script(code):
                return (await call("flexsim_execute_script", {"params": {"script": code}})).removeprefix("Result: ")

            print("PREP:", (await call("flexsim_prepare_gui_model", {"params": {"model_path": str(MODEL)}}))[:70], flush=True)
            t0 = time.time()
            while time.time() - t0 < 150:
                if (await call("flexsim_gui_status")).startswith("✓"):
                    break
                await asyncio.sleep(3)

            objs = [
                ("Source", "SrcMP", 0, 0), ("Queue", "QRecep", 6, 0),
                ("Processor", "Picadora", 12, 0), ("Queue", "QMix", 18, 0),
                ("Processor", "Mix1", 24, -8), ("Processor", "Mix2", 24, 8),
                ("Processor", "FormA", 30, -8), ("Processor", "EstA", 36, -8),
                ("Processor", "EnvA", 42, -8), ("Sink", "SinkA", 48, -8),
                ("Processor", "FormB", 30, 8), ("Processor", "EstB", 36, 8),
                ("Processor", "EnvB", 42, 8), ("Sink", "SinkB", 48, 8),
            ]
            for cls, name, x, y in objs:
                got = await script(f'Object o = Object.create("{cls}"); o.name = "{name}"; o.setLocation({x}, {y}, 0); return o.name;')
                assert got == name, f"create {name}: {got!r}"
            print("Creados 14 objetos", flush=True)

            links = [("SrcMP", "QRecep"), ("QRecep", "Picadora"), ("Picadora", "QMix"),
                     ("QMix", "Mix1"), ("QMix", "Mix2"),
                     ("Mix1", "FormA"), ("Mix2", "FormB"),
                     ("FormA", "EstA"), ("EstA", "EnvA"), ("EnvA", "SinkA"),
                     ("FormB", "EstB"), ("EstB", "EnvB"), ("EnvB", "SinkB")]
            for a, b in links:
                await script(f'objectconnect(Model.find("{a}"), Model.find("{b}")); return 1;')
            chk = await script('Object a = Model.find("Mix1"); return a.outObjects[1].name;')
            assert chk == "FormA", chk
            print("Conectado (13 links)", flush=True)

            props = [("SrcMP", "InterArrivalTime", 2), ("Picadora", "ProcessTime", 1.5),
                     ("Mix1", "ProcessTime", 1200), ("Mix2", "ProcessTime", 1200),
                     ("FormA", "ProcessTime", 0.26), ("FormB", "ProcessTime", 0.26),
                     ("EstA", "ProcessTime", 0.4), ("EstB", "ProcessTime", 0.4),
                     ("EnvA", "ProcessTime", 0.4), ("EnvB", "ProcessTime", 0.4)]
            for name, prop, val in props:
                await script(f'Object o = Model.find("{name}"); o.setProperty("{prop}", {val}); return 1;')
            print("Configurado", flush=True)

            print(await call("flexsim_reset"), flush=True)
            print(await call("flexsim_run_to_time", {"params": {"target_time": 1500, "run_speed": 1000}}), flush=True)
            for m in ["SrcMP", "Picadora", "Mix1", "FormA", "EstA", "EnvA", "SinkA", "SinkB"]:
                inn = await script(f'Object k = Model.find("{m}"); return k.stats.input.value;')
                out = await script(f'Object k = Model.find("{m}"); return k.stats.output.value;')
                print(f"  {m}: in={inn} out={out}", flush=True)
            print(await call("flexsim_save_model", {"params": {}}), flush=True)
    subprocess.run(["powershell", "-NoProfile", "-Command",
                    "Get-Process flexsim -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -like '*linea3_E4_v1*' } | Stop-Process -Force"],
                   capture_output=True)
    print("MODELO:", MODEL, "existe:", MODEL.exists(), flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
