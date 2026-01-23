@echo off
setlocal
cd /d "%~dp0"

REM ====================================================
REM CONFIGURATION
REM ====================================================
REM If nginx is not in your PATH, set the full path here:
REM Example: set NGINX_EXE="C:\nginx\nginx.exe"
set NGINX_EXE=nginx

REM ====================================================

REM Create Nginx temp directories if they don't exist
if not exist "%~dp0nginx\temp" mkdir "%~dp0nginx\temp"
if not exist "%~dp0nginx\temp\client_body_temp" mkdir "%~dp0nginx\temp\client_body_temp"
if not exist "%~dp0nginx\temp\proxy_temp" mkdir "%~dp0nginx\temp\proxy_temp"
if not exist "%~dp0nginx\temp\fastcgi_temp" mkdir "%~dp0nginx\temp\fastcgi_temp"
if not exist "%~dp0nginx\temp\uwsgi_temp" mkdir "%~dp0nginx\temp\uwsgi_temp"
if not exist "%~dp0nginx\temp\scgi_temp" mkdir "%~dp0nginx\temp\scgi_temp"
if not exist "%~dp0nginx\logs" mkdir "%~dp0nginx\logs"

:MENU
cls
echo ==========================================
echo mydudu App Launcher (Single Terminal)
echo ==========================================
echo.
echo 1. Start Web Operator Stack
echo 2. Start Web Parent Stack
echo 3. Exit
echo.
set /p choice=Enter choice: 

if "%choice%"=="1" goto OPERATOR
if "%choice%"=="2" goto PARENT
if "%choice%"=="3" goto END
goto MENU

:OPERATOR
echo Starting Web Operator Stack...
set PORT=3331
set NEXT_PUBLIC_API_URL=http://localhost:8081/api

npx concurrently -k -n "API,WEB,NGINX" -c "blue,green,magenta" ^
  "cd mydudu/apps/api && npm run start:dev" ^
  "cd mydudu/apps/web-operator && npm run dev -- -p 3330" ^
  "%NGINX_EXE% -p %~dp0nginx -c operator.conf -g \"daemon off;\""

goto END

:PARENT
echo Starting Web Parent Stack...
set PORT=4441
set NEXT_PUBLIC_API_URL=http://localhost:8082/api

npx concurrently -k -n "API,WEB,NGINX" -c "blue,green,magenta" ^
  "cd mydudu/apps/api && npm run start:dev" ^
  "cd mydudu/apps/web-parent && npm run dev -- -p 4440" ^
  "%NGINX_EXE% -p %~dp0nginx -c parent.conf -g \"daemon off;\""

goto END

:END
echo.
echo Closing launcher...
timeout /t 3 >nul
exit
