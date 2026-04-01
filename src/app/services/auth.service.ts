import { Injectable } from '@angular/core';

export interface AppUser {
  id: number;
  name: string;
  email: string;
  password?: string;
  role: string;
  group: string;
  status: string;
  joined: string;
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
  // ── IDENTIDAD DEL USUARIO ─────────────────────────────────────────────
  private currentUserData: { email: string; name: string } | null = null;
  
  // ── PERMISOS DEL USUARIO ──────────────────────────────────────────────
  private currentUserPermissions: string[] = [];

  // ── BASE DE DATOS MOCK DE USUARIOS ────────────────────────────────────
  private usersDB: AppUser[] = [];

  // ── ESTADO DEL GRUPO DE TRABAJO ───────────────────────────────────────
  private availableGroups: UserGroup[] = [
    { id: 'management', name: 'Management', icon: 'pi pi-briefcase', members: 2, description: 'Executive and administrative staff', color: '#6366f1' },
    { id: 'sales', name: 'Sales', icon: 'pi pi-chart-line', members: 2, description: 'Sales reps and account managers', color: '#22c55e' },
    { id: 'support', name: 'Support', icon: 'pi pi-headphones', members: 2, description: 'Customer support and helpdesk team', color: '#0ea5e9' }
  ];
  private activeGroup: UserGroup | null = null;

  constructor() {
    this.loadSession();
  }

  private loadSession() {
    const savedUser = sessionStorage.getItem('mockUser');
    const savedPerms = sessionStorage.getItem('mockPerms');
    const savedUsersDB = sessionStorage.getItem('mockUsersDB');

    if (savedUsersDB) {
      this.usersDB = JSON.parse(savedUsersDB);
    } else {
      // Initialize Default Users with integrated permissions
      this.usersDB = [
        { id: 1, name: 'Super Admin',   email: 'superadmin@erp.com', password: 'password', role: 'Admin',   group: 'Management', status: 'Active',   joined: 'Jan 2024', permissions: ['group:view', 'group:add', 'group:edit', 'group:delete', 'users:view', 'user:add', 'user:edit', 'user:delete', 'ticket:view', 'ticket:add', 'ticket:edit', 'ticket:delete', 'ticket:edit_state'] },
        { id: 2, name: 'Admin',         email: 'admin@admin.com',    password: 'password', role: 'Admin',   group: 'Management', status: 'Active',   joined: 'Jan 2024', permissions: ['group:view', 'group:add', 'group:edit', 'group:delete', 'users:view', 'user:add', 'user:edit', 'user:delete', 'ticket:view', 'ticket:add', 'ticket:edit', 'ticket:delete', 'ticket:edit_state'] },
        { id: 3, name: 'John Doe',      email: 'johndoe@test.com',   password: 'password', role: 'User',    group: 'Sales',      status: 'Active',   joined: 'Mar 2024', permissions: ['group:view', 'ticket:view', 'ticket:edit_state', 'user:view', 'user:edit'] },
        { id: 4, name: 'Jane Smith',    email: 'janesmith@test.com', password: 'password', role: 'User',    group: 'Sales',      status: 'Inactive', joined: 'Feb 2024', permissions: ['group:view', 'ticket:view', 'ticket:edit_state', 'user:view', 'user:edit'] },
        { id: 5, name: 'David Lee',     email: 'david@erp.com',      password: 'password', role: 'Manager', group: 'Management', status: 'Active',   joined: 'Apr 2024', permissions: ['group:view', 'ticket:view', 'ticket:edit_state', 'ticket:add', 'user:view'] },
        { id: 6, name: 'Eva Brown',     email: 'eva@erp.com',        password: 'password', role: 'User',    group: 'Support',    status: 'Active',   joined: 'Jun 2024', permissions: ['group:view', 'ticket:view', 'ticket:edit_state', 'user:view', 'user:edit'] },
        { id: 7, name: 'Frank Miller',  email: 'frank@erp.com',      password: 'password', role: 'Manager', group: 'Support',    status: 'Inactive', joined: 'Aug 2024', permissions: ['group:view', 'ticket:view', 'ticket:edit_state', 'ticket:add', 'user:view'] },
      ];
      this.saveUsersDB();
    }

    if (savedUser) {
      this.currentUserData = JSON.parse(savedUser);
    } else {
      this.currentUserData = { email: 'admin@admin.com', name: 'Admin' };
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

  setCurrentUser(user: { email: string; name: string }) {
    this.currentUserData = user;
    sessionStorage.setItem('mockUser', JSON.stringify(user));
  }

  getCurrentUser() {
    return this.currentUserData;
  }

  /**
   * 2. GESTION DE USUARIOS
   */
  getUsers(): AppUser[] {
    return this.usersDB;
  }

  saveUsersDB() {
    sessionStorage.setItem('mockUsersDB', JSON.stringify(this.usersDB));
  }

  addUser(user: AppUser) {
    this.usersDB.unshift(user);
    this.saveUsersDB();
  }

  updateUser(updatedUser: AppUser) {
    const idx = this.usersDB.findIndex(u => u.id === updatedUser.id);
    if (idx !== -1) {
      this.usersDB[idx] = updatedUser;
      this.saveUsersDB();
    }
  }

  deleteUser(userId: number) {
    this.usersDB = this.usersDB.filter(u => u.id !== userId);
    this.saveUsersDB();
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