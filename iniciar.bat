@echo off
title Distribuidora RC

echo Iniciando Backend...
start "Backend" cmd /k "cd /d "%~dp0backend" && npm run dev"

echo Iniciando Frontend...
start "Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo Ambos servidores iniciados. Puedes cerrar esta ventana.
