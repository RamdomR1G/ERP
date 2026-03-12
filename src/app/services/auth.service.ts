import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // En un entorno real, estos vendrían cargados de la base de datos tras el login.
  // Por ahora, simulamos los permisos base del `Common User` a modo de default seguro.
  // Puedes usar ?permissions=admin o lo que desees probar luego cambiando esto
  private currentUserPermissions: string[] = [
    'group:view', 
    'ticket:view', 
    'ticket:edit_state', 
    'user:view', 
    'user:edit',
    'users:view',
    'ticket:add',
    'group:add'
  ];
  constructor() {}
  /**
   * Actualiza el set de permisos actuales.
   */
  setPermissions(permissionsArray: string[]) {
    this.currentUserPermissions = permissionsArray;
  }
  /**
   * Verifica estrictamente si el usuario posee un string de permiso específico
   * @param permissionName el nombre de la acción.
   */
  hasPermission(permissionName: string): boolean {
    return this.currentUserPermissions.includes(permissionName);
  }
}