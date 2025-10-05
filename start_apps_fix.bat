@echo off
REM start_apps_fix.bat
REM Reliable launcher: start Unity (optional), create env dump, and start npm start in a new PowerShell window
REM using the explicit npm.cmd path. Keeps output in server.log for inspection.

setlocal

REM ---------- CONFIG (your paths) ----------
set "UNITY_EXE=C:\Users\techd\OneDrive\Desktop\new_build\GesturesDetectionUsingMediaPipe.exe"
set "NODE_PROJECT_DIR=C:\Users\techd\OneDrive\Documents\Sign Language UDP"
set "WEB_PORT=3000"
REM ----------------------------------------

set "LAUNCH_LOG=%~dp0start_apps_fix.log"
set "SERVER_LOG=%NODE_PROJECT_DIR%\server.log"
set "SERVER_ERR=%NODE_PROJECT_DIR%\server.err"
set "ENV_DUMP=%NODE_PROJECT_DIR%\env_dump.txt"

echo [%DATE% %TIME%] ---- start_apps_fix started ---- >> "%LAUNCH_LOG%"

REM 1) Launch Unity if present
if exist "%UNITY_EXE%" (
  echo [%DATE% %TIME%] Launching Unity: "%UNITY_EXE%" >> "%LAUNCH_LOG%"
  start "" "%UNITY_EXE%"
) else (
  echo [%DATE% %TIME%] Unity exe not found (skipping) >> "%LAUNCH_LOG%"
)

REM 2) Validate Node project
if not exist "%NODE_PROJECT_DIR%\package.json" (
  echo [%DATE% %TIME%] ERROR: package.json not found in "%NODE_PROJECT_DIR%" >> "%LAUNCH_LOG%"
  echo package.json not found. Aborting.
  exit /b 1
)

REM 3) Resolve npm.cmd (prefer npm.cmd on Windows)
set "NPM_CMD="
for %%A in ("%ProgramFiles%\nodejs\npm.cmd" "%ProgramFiles(x86)%\nodejs\npm.cmd") do (
  if exist %%~A set "NPM_CMD=%%~A"
)
if not defined NPM_CMD (
  for /f "usebackq delims=" %%p in (`where npm 2^>nul`) do (
    if /i "%%~xP"==".cmd" set "NPM_CMD=%%~p"
  )
)

if not defined NPM_CMD (
  echo [%DATE% %TIME%] ERROR: npm.cmd not found. Please install Node.js or add npm to PATH. >> "%LAUNCH_LOG%"
  start "WebApp (npm missing)" cmd /k "echo npm not found. Install Node.js or add to PATH & pause"
  exit /b 2
)
echo [%DATE% %TIME%] Using npm command: "%NPM_CMD%" >> "%LAUNCH_LOG%"

REM 4) Create env dump inside project (so we know the env visible to processes)
echo [%DATE% %TIME%] Creating env dump at "%ENV_DUMP%" >> "%LAUNCH_LOG%"
cmd /c "cd /d \"%NODE_PROJECT_DIR%\" && set > \"%ENV_DUMP%\"" 2>> "%LAUNCH_LOG%"

REM 5) Prepare server logs (append header)
>> "%SERVER_LOG%" echo ------------------------------------------------------------
>> "%SERVER_LOG%" echo [%DATE% %TIME%] Starting npm start (via start_apps_fix)
>> "%SERVER_LOG%" echo ------------------------------------------------------------
break>"%SERVER_ERR%"

REM 6) Launch npm start in a new PowerShell window and tee output to server.log (keeps window open)
REM Use -NoExit so you can see the interactive console if needed.
set "PS_CMD=Set-Location -LiteralPath '%NODE_PROJECT_DIR%'; & '%NPM_CMD%' start 2>&1 | Tee-Object -FilePath '%SERVER_LOG%'"
echo [%DATE% %TIME%] Starting PowerShell window to run npm start >> "%LAUNCH_LOG%"
start "WebApp Server" powershell -NoExit -NoProfile -Command "%PS_CMD%"

echo [%DATE% %TIME%] Launched npm start. Check '%SERVER_LOG%' and '%ENV_DUMP%' for output. >> "%LAUNCH_LOG%"

endlocal
exit /b 0
