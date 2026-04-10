import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MessageService } from 'primeng/api';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // Leeremos el permiso requerido desde la configuración de las rutas
  const requiredPermission = route.data?.['requiredPermission'];

  // Si la ruta no exige permiso, dejar pasar libremente
  if (!requiredPermission) {
    return true;
  }

  // Verifica con el servicio si el usuario tiene el permiso
  if (authService.hasPermission(requiredPermission)) {
    return true;
  }

  // Si no tiene el permiso, mostramos aviso visual y lo regresamos
  const messageService = inject(MessageService);
  
  messageService.add({
    severity: 'error',
    summary: 'Acceso Denegado',
    detail: 'No tienes los permisos necesarios para entrar a esta sección.',
    sticky: false,
    life: 5000
  });

  // ALERT DE RESPALDO PARA DEPURE (Solo para confirmar ejecución)
  alert(`[DEBUG] Acceso denegado a la ruta: ${state.url}\nPermiso faltante: ${requiredPermission}`);

  console.warn(`[Guard] Bloqueado acceso a ${state.url} por falta de permiso: ${requiredPermission}`);
  router.navigate(['/home/dashboard']);
  
  return false;
};