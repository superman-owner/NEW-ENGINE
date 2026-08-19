@echo off
title FXFORGE PPO ENGINE - Desktop Cockpit
cd /d "%~dp0"
echo ===================================================
echo   LAUNCHING FXFORGE PPO ENGINE (DESKTOP MODE)
echo ===================================================
npm run electron:dev
pause
