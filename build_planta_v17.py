#!/usr/bin/env python3
"""Arma planta_sanjorge_v1_3.fsm: v1.2 reespaciada (grilla x2, máquinas 5x4,
operarios al costado, cintas al hueco). Ver build_planta_v1.py (v1.1 base).

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
MODEL = Path(r"C:\Users\Asus\Desktop\Facultad\APUNTES CUARTO ANO\Simulacion\FabricaPaty_SanJorge\planta_sanjorge_v1_7.fsm")


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
                ("Source", "SrcMP", 0, 20), ("Queue", "QRecep", 12, 20),
                ("Rack", "AlmMP", 12, 30),
                ("Transporter", "MONT1", 0, 26), ("Dispatcher", "DSP1", 0, 32),
                ("Queue", "QPalT1", 10, 8), ("Processor", "DesT1", 13, 8),
                ("Queue", "PieT1", 19, 8), ("Operator", "OpDes1", 13, 5),
                ("Queue", "QPalT2", 10, 32), ("Processor", "DesT2", 13, 32),
                ("Queue", "PieT2", 19, 32), ("Operator", "OpDes2", 13, 29),
                ("Queue", "QPalL3", 10, -20), ("Processor", "DesL3", 13, -20),
                ("Queue", "PieL3", 19, -20), ("Operator", "OpDesL3", 13, -23),
                ("Processor", "PicT1", 24, 14),                 ("Processor", "MixT1", 36, 14), ("Queue", "BufT1", 42, 14),
                ("Separator", "SepT1", 46, 14), ("Queue", "DistT1", 52, 14),
                ("Processor", "PicT2", 24, 26),                 ("Processor", "MixT2", 36, 26), ("Queue", "BufT2", 42, 26),
                ("Separator", "SepT2", 46, 26), ("Queue", "DistT2", 52, 26),
                ("Processor", "FormL1", 72, 0),
                ("Processor", "FormL2", 72, 6), ("Processor", "Tunel12", 78, 6),
                ("Processor", "EstL2", 90, 6), ("Processor", "EnvL2", 102, 6),
                ("Processor", "FormL4", 72, 12), ("Processor", "Tunel45", 78, 14),
                ("Processor", "EstL4", 90, 12), ("Processor", "EnvL4", 102, 12),
                ("Processor", "FormL5", 72, 16),
                ("Processor", "FormL6", 72, 20), ("Processor", "Tunel6", 78, 20),
                ("Processor", "PicL3", 24, -14),                 ("Processor", "MixL3", 36, -14), ("Queue", "BufL3", 42, -14),
                ("Separator", "SepL3", 46, -14),
                ("Processor", "FormL3A", 60, -18), ("Processor", "FormL3B", 60, -10),
                ("Processor", "Tunel3", 72, -14),
                ("Processor", "EstL3A", 84, -18), ("Processor", "EstL3B", 84, -10),
                ("Processor", "EnvL3A", 96, -18), ("Processor", "EnvL3B", 96, -10),
                ("Rack", "AlmPT", 120, 0), ("Sink", "SinkEXP", 126, 0),
                ("Transporter", "MONT2", 120, 6), ("Operator", "OpMont", 120, 10),
                ("Operator", "OpL1", 66, -3), ("Operator", "OpL2", 66, 3),
                ("Operator", "OpL4", 66, 10), ("Operator", "OpL5", 68, 19),
                ("Operator", "OpL6", 74, 23), ("Operator", "OpL3A", 63, -21),
                ("Operator", "OpL3B", 63, -7),
            ]
            for cls, name, x, y in objs:
                extra = ""
                if cls == "Processor":
                    extra = " o.size.x = 5; o.size.y = 4;"
                got = await script(f'Object o = Object.create("{cls}"); o.name = "{name}"; o.setLocation({x}, {y}, 0);{extra} return o.name;')
                assert got == name, f"create {name}: {got!r}"
            print(f"Creados {len(objs)} objetos", flush=True)

            flow = [("SrcMP", "QRecep"), ("QRecep", "AlmMP"),
                    ("AlmMP", "QPalT1"), ("AlmMP", "QPalT2"), ("AlmMP", "QPalL3"),
                    ("QPalT1", "DesT1"), ("PieT1", "PicT1"),
                    ("QPalT2", "DesT2"), ("PieT2", "PicT2"),
                    ("QPalL3", "DesL3"), ("PieL3", "PicL3"),
                    ("PicT1", "MixT1"), ("MixT1", "BufT1"),
                    ("BufT1", "SepT1"), ("SepT1", "DistT1"),
                    ("PicT2", "MixT2"), ("MixT2", "BufT2"),
                    ("BufT2", "SepT2"), ("SepT2", "DistT2"),
                    ("DistT1", "FormL1"), ("DistT1", "FormL2"), ("DistT1", "FormL4"),
                    ("DistT2", "FormL5"), ("DistT2", "FormL6"),
                    # NOTA: sin links directos a/desde cintas (bypassean la cinta).
                    # Las cintas van solo por drag+transfers (bloque siguiente).
                    # Finales de línea confluyen al almacén único AlmPT.
                    ("Tunel12", "EstL2"), ("EstL2", "EnvL2"), ("EnvL2", "AlmPT"),
                    ("Tunel45", "EstL4"),
                    ("EstL4", "EnvL4"), ("EnvL4", "AlmPT"), ("Tunel45", "AlmPT"),
                    ("Tunel6", "AlmPT"),
                    ("PicL3", "MixL3"), ("MixL3", "BufL3"), ("BufL3", "SepL3"),
                    ("SepL3", "FormL3A"), ("SepL3", "FormL3B"),
                    ("Tunel3", "EstL3A"), ("Tunel3", "EstL3B"),
                    ("EstL3A", "EnvL3A"), ("EstL3B", "EnvL3B"),
                    ("EnvL3A", "AlmPT"), ("EnvL3B", "AlmPT"),
                    ("AlmPT", "SinkEXP")]
            for a, b in flow:
                await script(f'objectconnect(Model.find("{a}"), Model.find("{b}")); return 1;')
            # Rack: además del link necesita contextdrag "A" (si no, no traga).
            for a, b in (("QRecep", "AlmMP"), ("AlmMP", "QPalT1"), ("AlmMP", "QPalT2"), ("AlmMP", "QPalL3")):
                await script(f'contextdragconnection(Model.find("{a}"), Model.find("{b}"), "A"); return 1;')
            print("Rack AlmMP habilitado (drag adicional)", flush=True)
            for a, b in (("EnvL2", "AlmPT"), ("EnvL4", "AlmPT"), ("Tunel45", "AlmPT"),
                         ("Tunel6", "AlmPT"), ("EnvL3A", "AlmPT"), ("EnvL3B", "AlmPT"),
                         ("AlmPT", "SinkEXP")):
                await script(f'contextdragconnection(Model.find("{a}"), Model.find("{b}"), "A"); return 1;')
            print("Rack AlmPT habilitado (drag adicional)", flush=True)
            # Cintas: vía flexsim_add_conveyor_leg (crea cinta+transfers y encadena).
            # length = hueco entre máquinas - 1 (la de 10 m por defecto tapa todo).
            legs = [(("FormL1", "AlmPT", "BeltL1"), 78, 0, 11),
                    (("FormL2", "Tunel12", "BeltL2"), 75, 6, 5),
                    (("FormL4", "Tunel45", "BeltL4"), 75, 13, 5),
                    (("FormL5", "Tunel45", "BeltL5"), 75, 15, 5),
                    (("FormL6", "Tunel6", "BeltL6"), 75, 20, 5),
                    (("FormL3A", "Tunel3", "BeltL3A"), 66, -16, 10),
                    (("FormL3B", "Tunel3", "BeltL3B"), 66, -12, 10),
                    (("DesT1", "PieT1", "BeltDT1"), 16, 8, 4),
                    (("DesT2", "PieT2", "BeltDT2"), 16, 32, 4),
                    (("DesL3", "PieL3", "BeltDL3"), 16, -20, 4)]
            for (origin, target, belt), bx, by, blen in legs:
                out = await call("flexsim_add_conveyor_leg", {"params": {
                    "name": belt, "length": blen, "x": bx, "y": by, "z": 0.9,
                    "from_object": origin, "to_object": target}})
                print(f"  {belt}: " + out.replace("\n", " | ")[:220], flush=True)
            print("Cintas encadenadas (10 vía tool)", flush=True)
            for req, res in (("FormL1", "OpL1"), ("FormL2", "OpL2"), ("FormL4", "OpL4"),
                             ("FormL5", "OpL5"), ("FormL6", "OpL6"),
                             ("FormL3A", "OpL3A"), ("FormL3B", "OpL3B"),
                             ("MONT1", "DSP1"),
                             ("DesT1", "OpDes1"), ("DesT2", "OpDes2"), ("DesL3", "OpDesL3"),
                             ("MONT2", "OpMont")):
                await script(f'contextdragconnection(Model.find("{req}"), Model.find("{res}"), "S"); return 1;')
            chk = await script('Object a = Model.find("Tunel45"); string s = ""; for (int j = 1; j <= a.outObjects.length; j++) s = s + a.outObjects[j].name + ","; return s;')
            assert "EstL4" in chk and "AlmPT" in chk, chk
            chk2 = await script('Object a = Model.find("AlmMP"); string s = ""; for (int j = 1; j <= a.outObjects.length; j++) s = s + a.outObjects[j].name + ","; return s;')
            assert "QPalT1" in chk2 and "QPalT2" in chk2 and "QPalL3" in chk2, chk2
            print(f"Conectado ({len(flow)} flujo + 11 recursos)", flush=True)

            props = [("SrcMP", "InterArrivalTime", 1),
                     ("PicT1", "ProcessTime", 1.5), ("PicT2", "ProcessTime", 1.5),
                     ("PicL3", "ProcessTime", 1.5),
                     ("DesT1", "ProcessTime", 30), ("DesT2", "ProcessTime", 30),
                     ("DesL3", "ProcessTime", 30),
                     ("MixT1", "ProcessTime", 600),
                     ("MixT2", "ProcessTime", 600),
                     ("MixL3", "ProcessTime", 600)]
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
            for m in ["AlmMP", "QPalT1", "DesT1", "PieT1", "PicT1", "BeltDT1",
                      "FormL1", "BeltL1", "AlmPT", "SinkEXP"]:
                inn = await script(f'Object k = Model.find("{m}"); return k.stats.input.value;')
                out = await script(f'Object k = Model.find("{m}"); return k.stats.output.value;')
                print(f"  {m}: in={inn} out={out}", flush=True)
            print(await call("flexsim_save_model", {"params": {}}), flush=True)
    subprocess.run(["powershell", "-NoProfile", "-Command",
                    "Get-Process flexsim -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -like '*planta_sanjorge_v1*' } | Stop-Process -Force"],
                   capture_output=True)
    print("MODELO:", MODEL, "existe:", MODEL.exists(), flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
