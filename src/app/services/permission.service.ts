import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  // Mapa de permisos por grupo: { "group_id": ["perm1", "perm2"] }
  private userPermissionsMap = new Map<string, string[]>();
  
  // El grupo seleccionado actualmente en la sesión del usuario
  private activeGroupId = signal<string | null>(null);

  /**
   * Carga los permisos desde el objeto del usuario (Backend)
   */
  setPermissions(permissionsMap: { [key: string]: string[] }) {
    this.userPermissionsMap.clear();
    Object.keys(permissionsMap).forEach(groupId => {
      this.userPermissionsMap.set(groupId, permissionsMap[groupId]);
    });
  }

  /**
   * Cambia el contexto de permisos al grupo especificado
   */
  refreshPermissionsForGroup(groupId: string): void {
    this.activeGroupId.set(groupId);
    console.log(`[PermissionService] Contexto cambiado al grupo: ${groupId}`);
  }

  /**
   * Verifica si el usuario tiene un permiso específico en el grupo activo
   */
  hasPermission(permission: string): boolean {
    // 1. Siempre verificar permisos globales primero (independiente del grupo activo)
    const globalPerms = this.userPermissionsMap.get('global') || [];
    if (globalPerms.includes(permission) || globalPerms.includes('*') || globalPerms.includes('admin')) {
        return true;
    }

    const currentGroup = this.activeGroupId();
    
    // Si no hay grupo seleccionado y no es un permiso global, denegamos
    if (!currentGroup) return false;

    const groupPerms = this.userPermissionsMap.get(currentGroup) || [];
    
    // Soporte para comodín por grupo
    return groupPerms.includes(permission) || groupPerms.includes('*') || groupPerms.includes('admin');
  }

  /**
   * Obtiene el ID del grupo activo actualmente
   */
  getActiveGroupId(): string | null {
    return this.activeGroupId();
  }
}
