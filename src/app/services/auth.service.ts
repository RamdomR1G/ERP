import { Injectable, inject, signal } from '@angular/core';
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
  private readonly authUrl = 'http://localhost:3000/api/auth';
  private permissionService = inject(PermissionService);

  // ── IDENTIDAD DEL USUARIO ─────────────────────────────────────────────
  private currentUserData: any | null = null;
  
  // ── PERMISOS Y TOKEN ─────────────────────────────────────────────────
  private currentUserPermissions: string[] = [];
  private token: string | null = null;

  // ── ESTADO DEL GRUPO DE TRABAJO ───────────────────────────────────────
  private availableGroups: UserGroup[] = [];
  private activeGroup = signal<UserGroup | null>(null);

  // ── COOKIE HELPERS ─────────────────────────────
  private setCookie(name: string, value: string, days: number = 1) {
    let expires = "";
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Strict";
  }

  private getCookie(name: string) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  private eraseCookie(name: string) {
    document.cookie = name + '=; Max-Age=-99999999; path=/;';
  }

  constructor() {
    this.loadSession();
  }

  private loadSession() {
    this.token = this.getCookie('auth_token');
    const savedUser = sessionStorage.getItem('mockUser');

    if (savedUser) {
      this.currentUserData = JSON.parse(savedUser);
      // Re-hidratar permisos desde el servicio dedicado
      if (this.currentUserData.group_permissions) {
          this.permissionService.setPermissions(this.currentUserData.group_permissions);
      }
    } else {
      // Default fallback for development
      this.currentUserData = { id: '0000', email: 'admin@admin.com', name: 'Admin', role: 'Admin' };
    }
  }

  /**
   * 1. PERMISOS
   */
  setPermissions(permissionsObject: any) {
    this.permissionService.setPermissions(permissionsObject);
    // Al cambiar de usuario/permisos, por seguridad cerramos el grupo activo
    this.activeGroup.set(null); 
    sessionStorage.setItem('mockPermsMap', JSON.stringify(permissionsObject));
  }

  hasPermission(permissionName: string, flexible: boolean = false): boolean {
    const user = this.getCurrentUser();
    if (user?.role === 'Admin') return true;
    return this.permissionService.hasPermission(permissionName, flexible);
  }

  setCurrentUser(user: any) {
    this.currentUserData = user;
    sessionStorage.setItem('mockUser', JSON.stringify(user));
    
    if (user.group_permissions) {
      let perms = user.group_permissions;
      if (typeof perms === 'string') {
        try {
          perms = JSON.parse(perms);
        } catch (e) {
          console.error('[AuthService] Error parsing group_permissions string:', e);
          perms = {};
        }
      }
      this.setPermissions(perms);
    }
  }

  getCurrentUser() {
    return this.currentUserData;
  }

  /**
   * 2. GESTION DE USUARIOS
   */
  login(email: string, password: string): Observable<any> {
    // Limpieza agresiva de sesión previa al intentar un nuevo login
    this.eraseCookie('auth_token');
    sessionStorage.clear();
    
    return this.http.post(`${this.authUrl}/login`, { email, password }).pipe(
      tap((response: any) => {
        console.log('[AuthService] Login Response:', response);
        if (response.user) {
          this.token = response.token;
          this.setCookie('auth_token', response.token || '', 1);
          this.setCurrentUser(response.user);
          this.setPermissions(response.user.group_permissions || {});
        }
      })
    );
  }

  register(name: string, email: string, password: string): Observable<any> {
    return this.http.post(`${this.authUrl}/register`, { name, email, password });
  }

  getUsers(): Observable<AppUser[]> {
    return this.http.get<AppUser[]>(this.apiUrl);
  }
  
  getToken(): string | null {
    return this.getCookie('auth_token');
  }

  logout() {
    this.eraseCookie('auth_token');
    this.token = null;
    sessionStorage.clear();
    this.currentUserData = null;
    this.activeGroup.set(null);
    this.permissionService.clearPermissions();
  }

  addUser(user: AppUser): Observable<any> {
    const payload = {
        name: user.name,
        email: user.email,
        password: user.password,
        role: user.role,
        group_ids: user.group_ids, // Multiple groups insertion
        status: user.status,
        permissions: user.permissions || [],
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
        permissions: updatedUser.permissions || [],
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
    this.activeGroup.set(group);
    if (group) {
        this.permissionService.refreshPermissionsForGroup(group.id);
    }
  }

  getActiveGroup(): UserGroup | null {
    return this.activeGroup();
  }

  // Signal version for reactive components
  public activeGroupSignal = this.activeGroup.asReadonly();
}