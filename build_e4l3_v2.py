#!/usr/bin/env python3
"""Arma linea3_E4_v2.fsm: topología real L3 (túnel compartido + estuchadora por línea).

SrcMP > QRecep > Picadora > QMix > Mix1/Mix2 > FormA/FormB >
Tunel (compartido, 5 min) > EstA/EstB (1 por línea) > EnvA/EnvB > SinkA/SinkB.
Operarios OpA/OpB con conexión S a FormA/FormB.
Supuestos: molde 4 cav, batch 1500kg/20min, túnel 300 s, 150 paq/min.
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
MODEL = Path(r"C:\Users\Asus\Desktop\Facultad\APUNTES CUARTO ANO\Simulacion\FabricaPaty_SanJorge\linea3_E4_v2.fsm")


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
                ("Processor", "FormA", 30, -8), ("Processor", "FormB", 30, 8),
                ("Processor", "Tunel", 36, 0),
                ("Processor", "EstA", 42, -8), ("Processor", "EstB", 42, 8),
                ("Processor", "EnvA", 48, -8), ("Processor", "EnvB", 48, 8),
                ("Sink", "SinkA", 54, -8), ("Sink", "SinkB", 54, 8),
                ("Operator", "OpA", 30, -14), ("Operator", "OpB", 30, 14),
            ]
            for cls, name, x, y in objs:
                got = await script(f'Object o = Object.create("{cls}"); o.name = "{name}"; o.setLocation({x}, {y}, 0); return o.name;')
                assert got == name, f"create {name}: {got!r}"
            print("Creados 17 objetos", flush=True)

            links = [("SrcMP", "QRecep"), ("QRecep", "Picadora"), ("Picadora", "QMix"),
                     ("QMix", "Mix1"), ("QMix", "Mix2"),
                     ("Mix1", "FormA"), ("Mix2", "FormB"),
                     ("FormA", "Tunel"), ("FormB", "Tunel"),
                     ("Tunel", "EstA"), ("Tunel", "EstB"),
                     ("EstA", "EnvA"), ("EstB", "EnvB"),
                     ("EnvA", "SinkA"), ("EnvB", "SinkB")]
            for a, b in links:
                await script(f'objectconnect(Model.find("{a}"), Model.find("{b}")); return 1;')
            for req, res in (("FormA", "OpA"), ("FormB", "OpB")):
                await script(f'contextdragconnection(Model.find("{req}"), Model.find("{res}"), "S"); return 1;')
            chk = await script('Object a = Model.find("Tunel"); return a.outObjects.length;')
            assert chk == "2", chk
            chk2 = await script('Object a = Model.find("FormA"); return a.centerObjects[1].name;')
            assert chk2 == "OpA", chk2
            print("Conectado (15 flujo + 2 recursos)", flush=True)

            props = [("SrcMP", "InterArrivalTime", 2), ("Picadora", "ProcessTime", 1.5),
                     ("Mix1", "ProcessTime", 1200), ("Mix2", "ProcessTime", 1200),
                     ("FormA", "ProcessTime", 0.26), ("FormB", "ProcessTime", 0.26),
                     ("Tunel", "ProcessTime", 300),
                     ("EstA", "ProcessTime", 0.4), ("EstB", "ProcessTime", 0.4),
                     ("EnvA", "ProcessTime", 0.4), ("EnvB", "ProcessTime", 0.4)]
            for name, prop, val in props:
                await script(f'Object o = Model.find("{name}"); o.setProperty("{prop}", {val}); return 1;')
            print("Configurado", flush=True)

            print(await call("flexsim_reset"), flush=True)
            print(await call("flexsim_run_to_time", {"params": {"target_time": 1800, "run_speed": 1000}}), flush=True)
            for m in ["Picadora", "Mix1", "FormA", "Tunel", "EstA", "EnvA", "SinkA", "SinkB"]:
                inn = await script(f'Object k = Model.find("{m}"); return k.stats.input.value;')
                out = await script(f'Object k = Model.find("{m}"); return k.stats.output.value;')
                print(f"  {m}: in={inn} out={out}", flush=True)
            print(await call("flexsim_save_model", {"params": {}}), flush=True)
    subprocess.run(["powershell", "-NoProfile", "-Command",
                    "Get-Process flexsim -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -like '*linea3_E4_v2*' } | Stop-Process -Force"],
                   capture_output=True)
    print("MODELO:", MODEL, "existe:", MODEL.exists(), flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
