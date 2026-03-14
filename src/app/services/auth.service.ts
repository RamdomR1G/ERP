import { Injectable } from '@angular/core';

export interface UserGroup {
  id: string;
  name: string;
  icon: string;
  members?: number;
  description?: string;
  color?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // ── PERMISOS DEL USUARIO ──────────────────────────────────────────────
  private currentUserPermissions: string[] = [
    'group:view', 'ticket:view', 'ticket:edit_state', 'user:view', 'user:edit'
  ];

  // ── ESTADO DEL GRUPO DE TRABAJO ───────────────────────────────────────
  private availableGroups: UserGroup[] = [
    { id: 'management', name: 'Management', icon: 'pi pi-briefcase', members: 2, description: 'Executive and administrative staff', color: '#6366f1' },
    { id: 'sales', name: 'Sales', icon: 'pi pi-chart-line', members: 2, description: 'Sales reps and account managers', color: '#22c55e' },
    { id: 'support', name: 'Support', icon: 'pi pi-headphones', members: 2, description: 'Customer support and helpdesk team', color: '#0ea5e9' }
  ];
  private activeGroup: UserGroup | null = null;

  constructor() {}

  /**
   * 1. PERMISOS
   */
  setPermissions(permissionsArray: string[]) {
    this.currentUserPermissions = permissionsArray;
    // Al cambiar de usuario/permisos, por seguridad cerramos el grupo activo
    this.activeGroup = null; 
  }

  hasPermission(permissionName: string): boolean {
    return this.currentUserPermissions.includes(permissionName);
  }

  /**
   * 2. GRUPOS DE TRABAJO
   */
  setGroups(groups: UserGroup[]) {
    this.availableGroups = groups;
  }

  getAvailableGroups(): UserGroup[] {
    return this.availableGroups;
  }

  setActiveGroup(group: UserGroup | null) {
    this.activeGroup = group;
  }

  getActiveGroup(): UserGroup | null {
    return this.activeGroup;
  }
}