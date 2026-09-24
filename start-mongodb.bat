@echo off
:: Check for admin permissions
>nul 2>&1 "%SYSTEMROOT%\system32\cacls.exe" "%SYSTEMROOT%\system32\config\system"

if '%errorlevel%' NEQ '0' (
    echo Requesting administrative privileges to start MongoDB service...
    powershell -Command "Start-Process cmd -ArgumentList '/c net start MongoDB' -Verb RunAs"
    exit /B
)

net start MongoDB

