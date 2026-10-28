@echo off
chcp 65001 >nul
title PATY San Jorge - Gemelo digital (web)
rem Levanta el dashboard web (Next.js) y abre el navegador en http://localhost:3000.
rem Se puede ejecutar desde cualquier lado: usa la carpeta de este archivo.

cd /d "%~dp0dashboard\web" || (echo No encuentro dashboard\web junto a este archivo. & pause & exit /b 1)

where npm >nul 2>nul || (echo Falta Node.js. Instalalo desde https://nodejs.org y volve a abrir este archivo. & pause & exit /b 1)

if not exist node_modules (
  echo Instalando dependencias por primera vez, tarda unos minutos...
  call npm install || (echo Fallo npm install. & pause & exit /b 1)
)

rem Si ya esta corriendo, solo abrir el navegador.
powershell -NoProfile -Command "try { Invoke-WebRequest -UseBasicParsing -TimeoutSec 3 http://localhost:3000 | Out-Null; exit 0 } catch { exit 1 }"
if %errorlevel%==0 (
  start "" http://localhost:3000
  exit /b 0
)

rem Abrir el navegador apenas responda (la primera vez compila y tarda).
start "" /b powershell -NoProfile -WindowStyle Hidden -Command "for ($i = 0; $i -lt 120; $i++) { try { Invoke-WebRequest -UseBasicParsing -TimeoutSec 60 http://localhost:3000 | Out-Null; Start-Process 'http://localhost:3000'; break } catch { Start-Sleep 1 } }"

echo.
echo   Web del gemelo digital: http://localhost:3000
echo   Para apagarla, cerra esta ventana.
echo.
call npm run dev
pause
