@echo off
echo ========================================================
echo        Publicando Web Sonora Studio en Vercel
echo ========================================================
echo.
echo Sigue las instrucciones en pantalla. 
echo 1. Si te pide iniciar sesion, selecciona "Continue with GitHub" o tu metodo preferido.
echo 2. Si te pregunta "Set up and deploy?", presiona la tecla Y y luego ENTER.
echo 3. Para el resto de las preguntas, simplemente presiona ENTER para aceptar las opciones por defecto.
echo.
cd nextapp
call npx vercel login
echo.
echo Iniciando despliegue de produccion...
call npx vercel --prod
echo.
echo ========================================================
echo ¡Despliegue finalizado! Revisa tu consola para ver el link.
echo ========================================================
pause
