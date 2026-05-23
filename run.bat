@echo off
title SlideQuiz AI Launcher
echo ===================================================
echo           SlideQuiz AI Startup Launcher
echo ===================================================
echo.

echo [1/3] Kiem tra va cai dat Python Dependencies...
python -m pip install -r backend\requirements.txt
if %ERRORLEVEL% neq 0 (
    echo [Loi] Khong the cai dat Python packages. Vui long kiem tra Python.
    pause
    exit /b %ERRORLEVEL%
)
echo.

echo [2/3] Kiem tra va cai dat Frontend Dependencies...
if not exist "frontend\node_modules" (
    echo Khong tim thay node_modules. Dang tien hanh npm install...
    cd frontend
    call npm install
    cd ..
) else (
    echo Frontend packages da san sang.
)
echo.

echo [3/3] Dang khoi dong cac may chu...
echo.

echo Dang khoi dong Backend FastAPI tai cong 8000...
start "SlideQuiz API Backend" cmd /k "python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000"

echo Dang khoi dong Frontend React (Vite) tai cong 5173...
start "SlideQuiz React Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================
echo [Thanh cong] Kich hoat ung dung hoan tat!
echo Dang mo trinh duyet tai http://localhost:5173
echo ===================================================
echo.

timeout /t 4 /nobreak >nul
start http://localhost:5173

pause
