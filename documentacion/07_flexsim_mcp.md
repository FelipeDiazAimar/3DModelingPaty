# FlexSim y su MCP

## Límite de 100 objetos (licencia Student)

El modelo ya respeta la regla:

- **Un solo objeto visual:** toda la planta (Ciclo 1, Ciclo 2, Elaborados L1–L8, calles) entra como un GLB unido en
  una malla (`assets_v2/PATY_Planta_v10u.glb`, lo carga `Tools/OnModelOpen`).
- **Lo simulado va aparte:** las máquinas, cintas y móviles de L7/L8 (32 fijos, 8 cintas, 8 móviles) son
  objetos lógicos sobre ese modelo. Según `PLAN_MODELO_3D.md`, la licencia queda en 96/100.
- **Sin verificar contra el `.fsm` actual:** el archivo es binario (FlexSim 26). Se verifica con el MCP cuando
  FlexSimPy esté compilado (abajo).

## MCP de FlexSim (instalado en esta PC)

- Repo del equipo: <https://github.com/FelipeDiazAimar/MCP_Flexsim>, clonado en `TP Simulación/MCP_Flexsim`
  (fuera de este repo), con su submódulo FlexSimPy y dependencias (`uv sync`).
- Registrado en Claude Code para la carpeta `TP Simulación`:
  `claude mcp add --transport stdio flexsim -- uv --directory "<ruta>\MCP_Flexsim" run mcp_server/flexsim_mcp.py`.
- `uv run python utility/doctor.py`: todo OK salvo **FlexSimPy sin compilar**.

### Pendiente: compilar FlexSimPy

Falta el paquete de C++ de Visual Studio 2022 Community. Instalarlo (pide permisos de administrador):

```
"C:\Program Files (x86)\Microsoft Visual Studio\Installer\setup.exe" modify --installPath "C:\Program Files\Microsoft Visual Studio\2022\Community" --add Microsoft.VisualStudio.Workload.NativeDesktop --includeRecommended
```

y después, en `MCP_Flexsim`:

```
uv run python utility/build_automation.py --python-version 3.12 --install
uv run python utility/doctor.py --live
```

Con eso se puede abrir `PLANTASJ.fsm` sin ventana, contar los objetos y leer `OnModelOpen` sin modificarlo.

### Problema conocido: dos servidores en el puerto 8765

La ventana de FlexSim habla con el servidor MCP por `127.0.0.1:8765`, y solo un servidor puede atenderla. Si quedó
vivo un servidor de otra sesión (de Claude Code u OpenCode), FlexSim se conecta a ese y `flexsim_gui_status`
dice *Not connected* aunque la ventana esté abierta. Para ver quién tiene el puerto:

```
Get-NetTCPConnection -LocalPort 8765 | Select-Object State, OwningProcess
```

Si es un proceso viejo, cerrarlo (si corre como administrador, desde una terminal de administrador):
`taskkill /F /PID <pid>`. Después, en Claude Code, `/mcp` → `flexsim` → *Reconnect*, y volver a abrir el modelo.

## Pendiente: operarios en el publicador

`dashboard/flexsim/publicador.fls` ahora manda también `OpDesencajado_L7/L8` y `OpEnvasado_L7/L8` en `fleet`.
El `.fls` es una copia del código que vive en `PLANTASJ.fsm` (`Tools/Publicar`): hay que pegarlo ahí (a mano o
con el MCP) para que la web reciba sus posiciones. No suma objetos de licencia.
