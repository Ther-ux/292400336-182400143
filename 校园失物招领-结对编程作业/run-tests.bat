@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found. Please install Node.js 18 or newer to run unit tests.
  pause
  exit /b 1
)
node --test tests\store.test.js
if errorlevel 1 pause
