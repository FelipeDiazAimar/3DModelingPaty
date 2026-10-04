#!/usr/bin/env python3
"""Arma planta_sanjorge_v1.fsm: T1/T2 compartidos + cámaras cada 2 líneas + L1-L6 + bloque L3.

Topología (dato planta 2026-09-26 + catálogo sistema):
- Recepción SrcMP>QRecep > PicT1/PicT2 > Mix (2 c/u) > DistT1/DistT2 (carritos asumidos directos).
- L1 F19 s/estuche: FormL1>SinkL1. L2 F19+estuche+Camma: FormL2>Tunel12>EstL2>EnvL2>SinkL2.
- L4 F19+estuche+Bradman: FormL4>Tunel45>EstL4>EnvL4>SinkL4. L5 F26: FormL5>Tunel45>SinkL5.
- L6 F26: FormL6>Tunel6>SinkL6.
- Bloque L3 propio: PicL3 + MixL3a/b + FormL3A/B + Tunel3 + EstL3A/B + EnvL3A/B + SinkL3A/B.
- 1 Operator por formadora (S). Sin turnos/time-tables ni changeovers (pendiente mecanismo).
Supuestos: PTs v1 (mixer 1200 s batch, túnel 300 s, former 0.26, est/env 0.4, pic 1.5, IAT 1).
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
MODEL = Path(r"C:\Users\Asus\Desktop\Facultad\APUNTES CUARTO ANO\Simulacion\FabricaPaty_SanJorge\planta_sanjorge_v1_1.fsm")


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
                ("Source", "SrcMP", 0, 20), ("Queue", "QRecep", 6, 20),
                ("Processor", "PicT1", 12, 14), ("Processor", "MixT1a", 18, 10),
                ("Processor", "MixT1b", 18, 18), ("Queue", "BufT1", 21, 14),
                ("Separator", "SepT1", 23, 14), ("Queue", "DistT1", 26, 14),
                ("Processor", "PicT2", 12, 26), ("Processor", "MixT2a", 18, 22),
                ("Processor", "MixT2b", 18, 30), ("Queue", "BufT2", 21, 26),
                ("Separator", "SepT2", 23, 26), ("Queue", "DistT2", 26, 26),
                ("Processor", "FormL1", 36, 0), ("Sink", "SinkL1", 42, 0),
                ("Processor", "FormL2", 36, 6), ("Processor", "Tunel12", 39, 6),
                ("Processor", "EstL2", 45, 6), ("Processor", "EnvL2", 51, 6),
                ("Sink", "SinkL2", 57, 6),
                ("Processor", "FormL4", 36, 12), ("Processor", "Tunel45", 39, 14),
                ("Processor", "EstL4", 45, 12), ("Processor", "EnvL4", 51, 12),
                ("Sink", "SinkL4", 57, 12),
                ("Processor", "FormL5", 36, 16), ("Sink", "SinkL5", 45, 16),
                ("Processor", "FormL6", 36, 20), ("Processor", "Tunel6", 39, 20),
                ("Sink", "SinkL6", 45, 20),
                ("Processor", "PicL3", 12, -14), ("Processor", "MixL3a", 18, -18),
                ("Processor", "MixL3b", 18, -10), ("Queue", "BufL3", 21, -14),
                ("Separator", "SepL3", 23, -14),
                ("Processor", "FormL3A", 30, -18), ("Processor", "FormL3B", 30, -10),
                ("Processor", "Tunel3", 36, -14),
                ("Processor", "EstL3A", 42, -18), ("Processor", "EstL3B", 42, -10),
                ("Processor", "EnvL3A", 48, -18), ("Processor", "EnvL3B", 48, -10),
                ("Sink", "SinkL3A", 54, -18), ("Sink", "SinkL3B", 54, -10),
                ("Operator", "OpL1", 36, -4), ("Operator", "OpL2", 42, 2),
                ("Operator", "OpL4", 42, 10), ("Operator", "OpL5", 39, 16),
                ("Operator", "OpL6", 42, 20), ("Operator", "OpL3A", 33, -18),
                ("Operator", "OpL3B", 33, -10),
            ]
            for cls, name, x, y in objs:
                got = await script(f'Object o = Object.create("{cls}"); o.name = "{name}"; o.setLocation({x}, {y}, 0); return o.name;')
                assert got == name, f"create {name}: {got!r}"
            print(f"Creados {len(objs)} objetos", flush=True)

            flow = [("SrcMP", "QRecep"), ("QRecep", "PicT1"), ("QRecep", "PicT2"),
                    ("PicT1", "MixT1a"), ("PicT1", "MixT1b"), ("MixT1a", "BufT1"), ("MixT1b", "BufT1"),
                    ("BufT1", "SepT1"), ("SepT1", "DistT1"),
                    ("PicT2", "MixT2a"), ("PicT2", "MixT2b"), ("MixT2a", "BufT2"), ("MixT2b", "BufT2"),
                    ("BufT2", "SepT2"), ("SepT2", "DistT2"),
                    ("DistT1", "FormL1"), ("DistT1", "FormL2"), ("DistT1", "FormL4"),
                    ("DistT2", "FormL5"), ("DistT2", "FormL6"),
                    ("FormL1", "SinkL1"),
                    ("FormL2", "Tunel12"), ("Tunel12", "EstL2"), ("EstL2", "EnvL2"), ("EnvL2", "SinkL2"),
                    ("FormL4", "Tunel45"), ("FormL5", "Tunel45"), ("Tunel45", "EstL4"),
                    ("EstL4", "EnvL4"), ("EnvL4", "SinkL4"), ("Tunel45", "SinkL5"),
                    ("FormL6", "Tunel6"), ("Tunel6", "SinkL6"),
                    ("QRecep", "PicL3"), ("PicL3", "MixL3a"), ("PicL3", "MixL3b"),
                    ("MixL3a", "BufL3"), ("MixL3b", "BufL3"), ("BufL3", "SepL3"),
                    ("SepL3", "FormL3A"), ("SepL3", "FormL3B"),
                    ("FormL3A", "Tunel3"), ("FormL3B", "Tunel3"),
                    ("Tunel3", "EstL3A"), ("Tunel3", "EstL3B"),
                    ("EstL3A", "EnvL3A"), ("EstL3B", "EnvL3B"),
                    ("EnvL3A", "SinkL3A"), ("EnvL3B", "SinkL3B")]
            for a, b in flow:
                await script(f'objectconnect(Model.find("{a}"), Model.find("{b}")); return 1;')
            for req, res in (("FormL1", "OpL1"), ("FormL2", "OpL2"), ("FormL4", "OpL4"),
                             ("FormL5", "OpL5"), ("FormL6", "OpL6"),
                             ("FormL3A", "OpL3A"), ("FormL3B", "OpL3B")):
                await script(f'contextdragconnection(Model.find("{req}"), Model.find("{res}"), "S"); return 1;')
            chk = await script('Object a = Model.find("Tunel45"); return a.outObjects.length;')
            assert chk == "2", chk
            print(f"Conectado ({len(flow)} flujo + 7 recursos)", flush=True)

            props = [("SrcMP", "InterArrivalTime", 1),
                     ("PicT1", "ProcessTime", 1.5), ("PicT2", "ProcessTime", 1.5),
                     ("PicL3", "ProcessTime", 1.5),
                     ("MixT1a", "ProcessTime", 1200), ("MixT1b", "ProcessTime", 1200),
                     ("MixT2a", "ProcessTime", 1200), ("MixT2b", "ProcessTime", 1200),
                     ("MixL3a", "ProcessTime", 1200), ("MixL3b", "ProcessTime", 1200)]
            for name, prop, val in props:
                await script(f'Object o = Model.find("{name}"); o.setProperty("{prop}", {val}); return 1;')
            for name in ["FormL1", "FormL2", "FormL4", "FormL5", "FormL6", "FormL3A", "FormL3B"]:
                await script(f'Object o = Model.find("{name}"); o.setProperty("ProcessTime", 0.26); return 1;')
            for name in ["Tunel12", "Tunel45", "Tunel6", "Tunel3"]:
                await script(f'Object o = Model.find("{name}"); o.setProperty("ProcessTime", 300); return 1;')
            for name in ["EstL2", "EstL4", "EnvL2", "EnvL4", "EstL3A", "EstL3B", "EnvL3A", "EnvL3B"]:
                await script(f'Object o = Model.find("{name}"); o.setProperty("ProcessTime", 0.4); return 1;')
            print("Configurado", flush=True)

            print(await call("flexsim_reset"), flush=True)
            print(await call("flexsim_run_to_time", {"params": {"target_time": 1800, "run_speed": 1000}}), flush=True)
            for m in ["PicT1", "DistT1", "FormL1", "SinkL1", "SinkL2", "SinkL4",
                      "SinkL5", "SinkL6", "SinkL3A", "SinkL3B", "Tunel12", "Tunel3"]:
                inn = await script(f'Object k = Model.find("{m}"); return k.stats.input.value;')
                print(f"  {m}: in={inn}", flush=True)
            print(await call("flexsim_save_model", {"params": {}}), flush=True)
    subprocess.run(["powershell", "-NoProfile", "-Command",
                    "Get-Process flexsim -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -like '*planta_sanjorge_v1*' } | Stop-Process -Force"],
                   capture_output=True)
    print("MODELO:", MODEL, "existe:", MODEL.exists(), flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
