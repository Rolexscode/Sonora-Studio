@echo off
echo ========================================================
echo        Subiendo codigo a GitHub
echo ========================================================
echo.
set /p msg="Escribe que cambios hiciste (o presiona ENTER para usar un mensaje por defecto): "
if "%msg%"=="" set msg=Actualizacion de codigo

echo.
echo Preparando archivos...
call git add .
echo.
echo Creando punto de guardado (commit)...
call git commit -m "%msg%"
echo.
echo Subiendo a GitHub (esto actualizara Vercel automaticamente)...
call git push --set-upstream origin main
echo.
echo ========================================================
echo ¡Subida finalizada!
echo ========================================================
pause
