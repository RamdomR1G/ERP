import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PermissionService } from './permission.service';

export interface AppUser {
  id: string; // Changed to string for UUID matching backend
  name: string;
  email: string;
  password?: string;
  role: string;
  group_ids?: string[]; // Arrays de UUIDs para cruzar grupos múltiples
  status: string;
  joined: string;
  joined_date?: string; // from backend
  permissions: string[];
  group_permissions?: { [groupId: string]: string[] };
}

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
  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/users';
  private permissionService = inject(PermissionService);

  // ── IDENTIDAD DEL USUARIO ─────────────────────────────────────────────
  private currentUserData: any | null = null;
  
  // ── PERMISOS DEL USUARIO ──────────────────────────────────────────────
  private currentUserPermissions: string[] = [];

  // ── ESTADO DEL GRUPO DE TRABAJO ───────────────────────────────────────
  private availableGroups: UserGroup[] = [];
  private activeGroup: UserGroup | null = null;

  constructor() {
    this.loadSession();
  }

  private loadSession() {
    const savedUser = sessionStorage.getItem('mockUser');
    const savedPerms = sessionStorage.getItem('mockPerms');

    if (savedUser) {
      this.currentUserData = JSON.parse(savedUser);
      // Re-hidratar el mapa de permisos si existe
      const savedPermsMap = sessionStorage.getItem('mockPermsMap');
      if (savedPermsMap) {
        this.permissionService.setPermissions(JSON.parse(savedPermsMap));
      }
    } else {
      this.currentUserData = { id: '0000', email: 'admin@admin.com', name: 'Admin' };
    }

    if (savedPerms) {
      this.currentUserPermissions = JSON.parse(savedPerms);
    } else {
      this.currentUserPermissions = [
        'group:view', 'group:add', 'group:edit', 'group:delete',
        'users:view', 'user:add', 'user:edit', 'user:delete',
        'ticket:view', 'ticket:add', 'ticket:edit', 'ticket:delete', 'ticket:edit_state'
      ];
    }
  }

  /**
   * 1. PERMISOS
   */
  setPermissions(permissionsObject: any) {
    this.permissionService.setPermissions(permissionsObject);
    // Al cambiar de usuario/permisos, por seguridad cerramos el grupo activo
    this.activeGroup = null; 
    sessionStorage.setItem('mockPermsMap', JSON.stringify(permissionsObject));
  }

  hasPermission(permissionName: string): boolean {
    return this.permissionService.hasPermission(permissionName);
  }

  setCurrentUser(user: any) {
    this.currentUserData = user;
    sessionStorage.setItem('mockUser', JSON.stringify(user));
    if (user.group_permissions) {
      this.setPermissions(user.group_permissions);
    }
  }

  getCurrentUser() {
    return this.currentUserData;
  }

  /**
   * 2. GESTION DE USUARIOS
   */
  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { email, password }).pipe(
      tap((response: any) => {
        if (response.user) {
          this.setCurrentUser(response.user);
          this.setPermissions(response.user.group_permissions || {});
        }
      })
    );
  }

  getUsers(): Observable<AppUser[]> {
    const user = this.getCurrentUser();
    const url = `${this.apiUrl}?user_id=${user?.id || ''}&role=${user?.role || ''}`;
    return this.http.get<AppUser[]>(url);
  }

  addUser(user: AppUser): Observable<any> {
    const payload = {
        name: user.name,
        email: user.email,
        password: user.password,
        role: user.role,
        group_ids: user.group_ids, // Multiple groups insertion
        status: user.status,
        group_permissions: user.group_permissions
    };
    return this.http.post(this.apiUrl, payload);
  }

  updateUser(updatedUser: AppUser): Observable<any> {
    const payload: any = {
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        group_ids: updatedUser.group_ids,
        status: updatedUser.status,
        group_permissions: updatedUser.group_permissions
    };
    if (updatedUser.password) {
      payload.password = updatedUser.password;
    }
    return this.http.put(`${this.apiUrl}/${updatedUser.id}`, payload);
  }

  deleteUser(userId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${userId}`);
  }

  /**
   * 3. GRUPOS DE TRABAJO
   */
  setGroups(groups: UserGroup[]) {
    this.availableGroups = groups;
  }

  getAvailableGroups(): UserGroup[] {
    return this.availableGroups;
  }

  setActiveGroup(group: UserGroup | null) {
    this.activeGroup = group;
    if (group) {
        this.permissionService.refreshPermissionsForGroup(group.id);
    }
  }

  getActiveGroup(): UserGroup | null {
    return this.activeGroup;
  }
}