@echo off
setlocal
for %%a in (%*) do (
  for %%k in (commit push branch checkout switch worktree merge cherry-pick revert rebase am pull) do (
    if /i "%%~a"=="%%k" goto guard
  )
)
"%O_BROS_REAL_GIT%" %*
exit /b %ERRORLEVEL%
:guard
set ELECTRON_RUN_AS_NODE=1
"%O_BROS_WOT_NODE%" "%O_BROS_GIT_GUARD%" %*
exit /b %ERRORLEVEL%
