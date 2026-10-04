#!/usr/bin/env python3
"""Reabre planta_sanjorge_v1_7 y reporta recuento + lista de objetos."""
import asyncio
import json
import subprocess
import sys
import time
from pathlib import Path

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

REPO = Path(r"C:\Users\Asus\Desktop\Facultad\APUNTES CUARTO ANO\Simulacion\mcp_flexsim_opencode")
PROJ = Path(r"C:\Users\Asus\Desktop\Facultad\APUNTES CUARTO ANO\Simulacion\FabricaPaty_SanJorge")
MODEL = PROJ / "planta_sanjorge_v1_7.fsm"
FLEXSIM = r"C:\Program Files\FlexSim 2026\program\flexsim.exe"


async def main() -> int:
    subprocess.run(["powershell", "-NoProfile", "-Command",
                    "Get-Process flexsim -ErrorAction SilentlyContinue | Stop-Process -Force"],
                   capture_output=True)
    time.sleep(4)
    params = StdioServerParameters(command="uv", args=["--directory", str(REPO), "run", "mcp_server/flexsim_mcp.py"])
    win = subprocess.Popen([FLEXSIM, str(MODEL)])
    print(f"FlexSim lanzado pid={win.pid}", flush=True)

    async with stdio_client(params) as (read, write):
        async with ClientSession(read, write) as s:
            await s.initialize()

            async def call(tool, args=None):
                r = await s.call_tool(tool, args or {})
                return " | ".join(getattr(c, "text", "") for c in r.content)

            async def script(code):
                return (await call("flexsim_execute_script", {"params": {"script": code}})).removeprefix("Result: ")

            t0 = time.time()
            connected = False
            while time.time() - t0 < 180:
                st = await call("flexsim_gui_status")
                if st.startswith("✓"):
                    connected = True
                    break
                await asyncio.sleep(3)
            print(f"Conectado: {connected} ({time.time()-t0:.0f}s)", flush=True)
            if not connected:
                return 1

            total = await script('return model().subnodes.length - 2;')
            print(f"\n=== RECUENTO TOTAL DE OBJETOS: {total} ===\n", flush=True)

            insp = await call("flexsim_inspect_model")
            try:
                j = json.loads(insp)
                objs = j.get("objects", [])
                print(f"Objetos por clase ({len(objs)} en inspect):", flush=True)
                from collections import Counter
                cnt = Counter(o.get("class", "?") for o in objs)
                for cls, n in sorted(cnt.items(), key=lambda x: -x[1]):
                    print(f"  {cls}: {n}", flush=True)
                print("\n=== LISTA COMPLETA (nombre | clase) ===", flush=True)
                for o in objs:
                    print(f"  {o.get('name')} | {o.get('class')}", flush=True)
            except Exception as e:
                print("INSPECT parse err:", str(e)[:120], flush=True)
                print(insp[:800], flush=True)

    print("\nLISTO (ventana queda abierta)", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
