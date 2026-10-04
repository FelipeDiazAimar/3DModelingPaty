#!/usr/bin/env python3
"""Pinta ítems apilados (QPalT1) como cajas + screenshot."""
import asyncio
import base64
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
SHOT = Path(r"C:\Users\Asus\AppData\Local\Temp\planta_items3d.png")


async def main() -> int:
    params = StdioServerParameters(command="uv", args=["--directory", str(REPO), "run", "mcp_server/flexsim_mcp.py"])
    async with stdio_client(params) as (read, write):
        async with ClientSession(read, write) as s:
            await s.initialize()

            async def call(tool, args=None):
                r = await s.call_tool(tool, args or {})
                return " | ".join(getattr(c, "text", "") for c in r.content)

            async def script(code):
                return (await call("flexsim_execute_script", {"params": {"script": code}})).removeprefix("Result: ")

            subprocess.Popen(
                ["C:\\Program Files\\FlexSim 2026\\program\\flexsim.exe", str(MODEL)],
                stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                close_fds=True, cwd=str(Path.home()),
                creationflags=subprocess.DETACHED_PROCESS | subprocess.CREATE_NEW_PROCESS_GROUP)
            print("ventana lanzada con servidor ya escuchando", flush=True)
            t0 = time.time()
            connected = False
            while time.time() - t0 < 150:
                st = await call("flexsim_gui_status")
                if st.startswith("✓"):
                    connected = True
                    break
                await asyncio.sleep(3)
            print("connected:", connected, flush=True)
            if not connected:
                return 1
            import json as _json
            out = await call("flexsim_import_shape", {"params": {
                "object": "QRecep",
                "file_path": "C:/Users/Asus/Desktop/Facultad/APUNTES CUARTO ANO/Simulacion/FabricaPaty_SanJorge/caja_1m.stl",
                "shape_name": "Caja1m", "copy_next_to_model": False}})
            try:
                bi = int(_json.loads(out).get("shape_index", 0))
            except Exception:
                bi = 0
            print("box_idx:", bi, flush=True)
            print("RUN:", await call("flexsim_run_to_time", {"params": {"target_time": 300, "run_speed": 1000}}), flush=True)
            print("PAINT:", await script(
                f'Object q = Model.find("QPalT1"); int n = 0; int total = q.subnodes.length; '
                f'for (int i = 1; i <= q.subnodes.length; i++) {{ '
                f'treenode it = q.subnodes[i]; setobjectshapeindex(it, {bi}); n++; }} '
                f'return "" + total + "/" + n;'), flush=True)
            r = await s.call_tool("flexsim_screenshot",
                                  {"params": {"region": "view3d", "scale": 0.5, "format": "png", "method": "screen"}})
            for c in r.content:
                if getattr(c, "type", "") == "image":
                    SHOT.write_bytes(base64.b64decode(c.data))
                    print("shot:", SHOT.stat().st_size, flush=True)
    print("DONE (ventana queda abierta, SIN guardar)", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
