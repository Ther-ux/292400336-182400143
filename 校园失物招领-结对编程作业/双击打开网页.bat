@echo off
cd /d "%~dp0"
set "CHROME=C:\Program Files\Google\Chrome\Application\chrome.exe"
if exist "%CHROME%" (
  start "" "%CHROME%" "%CD%\index.html"
  exit /b 0
)
set "CHROME=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
if exist "%CHROME%" (
  start "" "%CHROME%" "%CD%\index.html"
  exit /b 0
)
start "" "%CD%\index.html"
