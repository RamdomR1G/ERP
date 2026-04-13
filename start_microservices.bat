@echo off
echo [ERP] Iniciando microservicios Fastify...

start "GATEWAY (3000)" cmd /c "node backend/services/gateway/server.js"
start "USER SERVICE (3001)" cmd /c "node backend/services/user/server.js"
start "TICKETS SERVICE (3002)" cmd /c "node backend/services/tickets/server.js"
start "GROUPS SERVICE (3003)" cmd /c "node backend/services/groups/server.js"

echo [ERP] Todos los servicios han sido lanzados en ventanas separadas.
pause
