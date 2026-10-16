@echo off
setlocal
if "%O_BROS_WOT_NODE%"=="" (
  echo WOT_UNAVAILABLE: wot only works inside a terminal that O-BROS opened, and O-BROS must be running. 1>&2
  exit /b 2
)
set ELECTRON_RUN_AS_NODE=1
"%O_BROS_WOT_NODE%" "%O_BROS_WOT_CLI%" %*
exit /b %ERRORLEVEL%
