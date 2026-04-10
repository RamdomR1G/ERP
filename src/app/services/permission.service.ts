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
  hasPermission(permission: string): boolean {
    // 0. LOG DE INICIO
    // console.log(`[PermissionService] Verificando permiso: ${permission}`);

    // 1. Siempre verificar permisos globales primero (independiente del grupo activo)
    const globalPerms = this.userPermissionsMap.get('global') || [];
    if (globalPerms.includes(permission) || globalPerms.includes('*') || globalPerms.includes('admin')) {
        console.log(`[PermissionService] ✅ PERMISO CONCEDIDO por GLOBAL: ${permission}`);
        return true;
    }

    const currentGroup = this.activeGroupId();
    
    // 2. Si NO hay grupo seleccionado, buscamos si tiene el permiso en CUALQUIERA de sus grupos
    if (!currentGroup) {
        for (const [groupId, perms] of this.userPermissionsMap.entries()) {
            if (perms.includes(permission) || perms.includes('*') || perms.includes('admin')) {
                console.log(`[PermissionService] ✅ PERMISO CONCEDIDO (Multi-grupo en ${groupId}): ${permission}`);
                return true;
            }
        }
        console.warn(`[PermissionService] ❌ PERMISO DENEGADO (Sin grupo activo y no hallado en ningún otro): ${permission}`);
        return false;
    }

    // 3. Si HAY grupo seleccionado, somos estrictos al contexto de ese grupo
    const groupPerms = this.userPermissionsMap.get(currentGroup) || [];
    const hasIt = groupPerms.includes(permission) || groupPerms.includes('*') || groupPerms.includes('admin');
    
    if (hasIt) {
        console.log(`[PermissionService] ✅ PERMISO CONCEDIDO en grupo ${currentGroup}: ${permission}`);
    } else {
        console.warn(`[PermissionService] ❌ PERMISO DENEGADO en grupo ${currentGroup}: ${permission}`);
    }

    return hasIt;
  }

  /**
   * Obtiene el ID del grupo activo actualmente
   */
  getActiveGroupId(): string | null {
    return this.activeGroupId();
  }
}
