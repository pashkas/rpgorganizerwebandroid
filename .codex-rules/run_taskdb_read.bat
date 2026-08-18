@echo off
setlocal

set PYTHONIOENCODING=utf-8
set TRANSFORMERS_VERBOSITY=error
set HF_HUB_DISABLE_PROGRESS_BARS=1
set TOKENIZERS_PARALLELISM=false
set NO_PROXY=127.0.0.1,localhost
set no_proxy=127.0.0.1,localhost

if not "%USER_TASKS_QDRANT_PYTHON%"=="" (
  set "PYTHON_EXE=%USER_TASKS_QDRANT_PYTHON%"
) else if exist "%USERPROFILE%\.claude\mcp\user-tasks-qdrant\.venv\Scripts\python.exe" (
  set "PYTHON_EXE=%USERPROFILE%\.claude\mcp\user-tasks-qdrant\.venv\Scripts\python.exe"
) else (
  set "PYTHON_EXE=python"
)

"%PYTHON_EXE%" "%~dp0taskdb_read_runner.py" %*
exit /b %ERRORLEVEL%
