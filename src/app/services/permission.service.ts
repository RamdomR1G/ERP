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
    const keys = Object.keys(permissionsMap || {});
    keys.forEach(groupId => {
      this.userPermissionsMap.set(groupId, permissionsMap[groupId]);
    });
    console.log(`[PermissionService] Permisos cargados para ${keys.length} contextos.`);
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
  /**
   * Verifica permisos. 
   * @param permission Permiso a buscar.
   * @param flexible Si es true, busca en todos los grupos (útil para visibilidad de Sidebar).
   */
  hasPermission(permission: string, flexible: boolean = false): boolean {
    // 1. ADMIN / GLOBAL - Siempre verificar permisos globales primero
    // (Incluye "*" o "admin" cargados en el contexto 'global')

    // 2. Permisos globales ( dashboard:view, etc )
    const globalPerms = this.userPermissionsMap.get('global') || [];
    if (globalPerms.includes(permission) || globalPerms.includes('*')) return true;

    const currentGroup = this.activeGroupId();
    
    // 3. Búsqueda FLEXIBLE (Para Sidebar)
    if (flexible) {
        for (const [groupId, perms] of this.userPermissionsMap.entries()) {
            if (perms.includes(permission) || perms.includes('*') || perms.includes('admin')) {
                return true;
            }
        }
        return false;
    }

    // 4. Búsqueda ESTRICTA (Contexto activo necesario para acciones)
    if (!currentGroup) return false;

    const groupPerms = this.userPermissionsMap.get(currentGroup) || [];
    return groupPerms.includes(permission) || groupPerms.includes('*') || groupPerms.includes('admin');
  }

  /**
   * Obtiene el ID del grupo activo actualmente
   */
  getActiveGroupId(): string | null {
    return this.activeGroupId();
  }
}
