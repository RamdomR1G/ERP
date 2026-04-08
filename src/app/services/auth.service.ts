import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface AppUser {
  id: string; // Changed to string for UUID matching backend
  name: string;
  email: string;
  password?: string;
  role: string;
  group: string;
  status: string;
  joined: string;
  joined_date?: string; // from backend
  permissions: string[];
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
  setPermissions(permissionsArray: string[]) {
    this.currentUserPermissions = permissionsArray;
    // Al cambiar de usuario/permisos, por seguridad cerramos el grupo activo
    this.activeGroup = null; 
    sessionStorage.setItem('mockPerms', JSON.stringify(permissionsArray));
  }

  hasPermission(permissionName: string): boolean {
    return this.currentUserPermissions.includes(permissionName);
  }

  setCurrentUser(user: any) {
    this.currentUserData = user;
    sessionStorage.setItem('mockUser', JSON.stringify(user));
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
          this.setPermissions(response.user.permissions || []);
        }
      })
    );
  }

  getUsers(): Observable<AppUser[]> {
    return this.http.get<AppUser[]>(this.apiUrl);
  }

  addUser(user: AppUser): Observable<any> {
    const payload = {
        name: user.name,
        email: user.email,
        password: user.password,
        role: user.role,
        group_id: user.group, // Supabase expects group_id
        status: user.status,
        permissions: user.permissions
    };
    return this.http.post(this.apiUrl, payload);
  }

  updateUser(updatedUser: AppUser): Observable<any> {
    const payload: any = {
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        group_id: updatedUser.group,
        status: updatedUser.status,
        permissions: updatedUser.permissions
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
  }

  getActiveGroup(): UserGroup | null {
    return this.activeGroup;
  }
}