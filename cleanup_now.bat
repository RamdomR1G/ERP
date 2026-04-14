@echo off
echo [ERP] Iniciando limpieza de archivos obsoletos...
echo.

:: 1. Eliminar carpetas huérfanas
if exist "backend\services\user-service" (
    echo Eliminando backend\services\user-service...
    rmdir /s /q "backend\services\user-service"
)
if exist "backend\services\tickets-service" (
    echo Eliminando backend\services\tickets-service...
    rmdir /s /q "backend\services\tickets-service"
)
if exist "backend\services\groups-service" (
    echo Eliminando backend\services\groups-service...
    rmdir /s /q "backend\services\groups-service"
)
if exist "backend\api-gateway" (
    echo Eliminando carpeta duplicada backend\api-gateway...
    rmdir /s /q "backend\api-gateway"
)

:: 2. Eliminar scripts de un solo uso
if exist "backend\normalize_permissions.js" (
    echo Borrando backend\normalize_permissions.js...
    del /f /q "backend\normalize_permissions.js"
)
if exist "backend\verify_metrics.js" (
    echo Borrando backend\verify_metrics.js...
    del /f /q "backend\verify_metrics.js"
)
if exist "install_cdk.bat" (
    echo Borrando install_cdk.bat...
    del /f /q "install_cdk.bat"
)

echo.
echo [ERP] ¡Limpieza completada con éxito!
echo Ya puedes borrar este archivo (cleanup_now.bat) manualmente si lo deseas.
pause
