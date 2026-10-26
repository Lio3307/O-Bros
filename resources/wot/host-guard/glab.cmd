@echo off
setlocal EnableDelayedExpansion
set "O_BROS_CMD_LINE=!CMDCMDLINE!"
setlocal DisableDelayedExpansion
set ELECTRON_RUN_AS_NODE=1
"%O_BROS_WOT_NODE%" "%O_BROS_HOST_GUARD%" glab %*
exit /b %ERRORLEVEL%
