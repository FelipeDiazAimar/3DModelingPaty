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

## Tablero de FlexSim alineado con la web (probado el 02/11/2026)

Los `.fls` del tablero (`indicadores.fls`, `arranca_indicadores.fls`, `tablero.fls`, `svg_estados.fls`, `svg_lineas.fls`,
`svg_barras.fls`) se cargaron en `PLANTASJ.fsm` (`Tools/Indicadores`, `Tools/ArrancaIndicadores`, `Tools/TableroHTML`,
`Tools/svgLineas`, `Tools/svgBarras`, `Tools/svgEstados`) con `fileopen`/`filereadline` + `setnodestr`, y el modelo se guardó.
FlexScript no interpreta `ó` en rutas: los archivos se copiaron a una carpeta sin acentos para leerlos.

- **Verificado:** el historial se arma cada 10 s (370 filas a 1,03 h, 28 columnas; la columna 28 es la meta de 3 pal/h) y
  `Tools/TableroHTML` genera el HTML (107 KB) con la meta, "En falla" y la tasa de 4 h, sin errores nuevos en la consola.
- **kg/h verificado:** a las 4 h, con ventana de 1 h, el historial da 1.550 kg/h (L7) y 1.600 kg/h (L8), igual que
  `(cajas ahora - cajas 1 h antes) x 5` que usa la web.
- **No verificado:** el aspecto visual del tablero dentro de FlexSim. Con 8.640 filas de historial por corrida de 24 h el modelo no se enlenteció en las réplicas.

### Cómo correr réplicas rápido

- La barra **Run Speed** vuelve a 4 con `Reset`. Un clic a mitad de la barra la pone cerca de 7.400, que en la práctica es
  "lo más rápido que da la PC": una réplica de 24 h tarda unos 2 minutos, no una hora.
- `resetmodel();` por `flexsim_execute_script` reinicia sin tocar la velocidad. Entre réplicas: `resetmodel();` y
  `Tools/repId = r`; luego `flexsim_run_to_time` a 86.400 s. Con la ventana de FlexSim minimizada la corrida casi no avanza.
- Antes de cerrar, vaciar `Tools/indHist`, `Tools/muestras` y `Tools/fallLog`: si no, el `.fsm` guarda el historial de la
  última réplica y pasa de 215 KB a unos 470 KB.

### Escenarios E2 y E3 reproducidos

Las 10 réplicas de E2 (padding de `CintaFormA/B_L7/L8` de 3,27 a 1,554 m, propiedad `EntrySpacePadding`) y de E3
(`Tools/mttrK = 1,25`) se volvieron a correr y dieron exactamente las mismas cantidades que las tuplas que estaban copiadas
en `analizar_escenarios.py`. Los datos crudos quedaron en `datos_trazabilidad/e1_final/raw_e2.txt` y `raw_e3.txt`, y el
script los lee junto con `raw_replicas.txt`; los JSON de la web salen idénticos.

### Estado 12

En las corridas de 3 a 4 h ninguna máquina estuvo en el estado 12 (las cintas usan el 13; el estado 20 es `STATE_DOWN`).
Por eso el tablero ahora cuenta como falla solo el 20, igual que la web.
