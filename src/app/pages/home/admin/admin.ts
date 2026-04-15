import { Component, ChangeDetectorRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { MultiSelect } from 'primeng/multiselect';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'primeng/tabs';
import { Tooltip } from 'primeng/tooltip';
import { AuthService, AppUser, UserGroup } from '../../../services/auth.service';
import { GroupService } from '../../../services/group.service';
import { DividerModule } from 'primeng/divider';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    TableModule, 
    ButtonModule, 
    TagModule, 
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    DialogModule, 
    InputTextModule, 
    Select, 
    MultiSelect, 
    Tooltip,
    HasPermissionDirective,
    DividerModule
  ],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class AdminComponent implements OnInit {
  private authService = inject(AuthService);
  private groupService = inject(GroupService);
  private cdr = inject(ChangeDetectorRef);

  users: AppUser[] = [];
  groups: UserGroup[] = [];
  stats = [
    { label: 'Total Users',  value: 0,  icon: 'pi pi-users',  color: '#6366f1' },
    { label: 'Total Groups', value: 0,  icon: 'pi pi-sitemap',color: '#22c55e' },
    { label: 'Active',       value: 0,  icon: 'pi pi-check',  color: '#0ea5e9' },
    { label: 'Inactive',     value: 0,  icon: 'pi pi-times',  color: '#f97316' },
  ];

  // ── FORMS STATE ────────────────────────────────
  userVisible: boolean = false;
  groupVisible: boolean = false;
  isSaving: boolean = false;
  
  selectedUser: Partial<AppUser> = {};
  selectedGroup: Partial<UserGroup> = {};

  availableRoles = [{label: 'Admin', value: 'Admin'}, {label: 'User', value: 'User'}, {label: 'Manager', value: 'Manager'}];
  availableStatuses = [{label: 'Active', value: 'Active'}, {label: 'Inactive', value: 'Inactive'}];
  
  availableIcons = [
    { label: 'Briefcase', value: 'pi pi-briefcase' },
    { label: 'Building', value: 'pi pi-building' },
    { label: 'Database', value: 'pi pi-database' },
    { label: 'Charts', value: 'pi pi-chart-bar' },
    { label: 'Folder', value: 'pi pi-folder' },
    { label: 'Settings', value: 'pi pi-cog' },
    { label: 'Box', value: 'pi pi-box' },
    { label: 'Envelope', value: 'pi pi-envelope' },
    { label: 'Flag', value: 'pi pi-flag' },
    { label: 'Key', value: 'pi pi-key' }
  ];
  
  // Lista completa de permisos granulares para el ERP
  allPermissions = [
    // TICKETS
    'ticket:view', 'ticket:add', 'ticket:edit', 'ticket:delete', 'ticket:move', 'ticket:comment',
    // USUARIOS
    'user:view', 'user:manage', 'user:add', 'user:edit', 'user:delete',
    // GRUPOS / WORKSPACES
    'group:view', 'group:manage', 'group:add', 'group:edit', 'group:delete',
    // GLOBAL (TODOS LOS PERMISOS)
    '*'
  ];

  ngOnInit() {
    this.refreshData();
  }

  refreshData() {
    forkJoin({
      users: this.authService.getUsers(),
      groups: this.groupService.getGroups()
    }).subscribe(res => {
      this.users = res.users;
      this.groups = (res.groups as any).data || res.groups;
      this.calculateStats();
      this.cdr.markForCheck(); // Safer than detectChanges() to avoid NG0100
    });
  }

  calculateStats() {
      this.stats[0].value = this.users.length;
      this.stats[1].value = this.groups.length;
      this.stats[2].value = this.users.filter(u => u.status === 'Active').length;
      this.stats[3].value = this.users.filter(u => u.status === 'Inactive').length;
  }

  getUserSeverity(status: string): 'success' | 'danger' {
    return status === 'Active' ? 'success' : 'danger';
  }

  // ── USER CRUD ──────────────────────────────────
  newUser() {
    this.selectedUser = { 
        name: '', 
        email: '', 
        password: '', 
        role: 'User', 
        status: 'Active', 
        group_ids: [],
        permissions: [],
        group_permissions: {}
    };
    console.log('[Admin] Preparing new user...');
    setTimeout(() => {
        this.userVisible = true;
        this.cdr.detectChanges();
    }, 0);
  }

  editUser(user: AppUser) {
    console.log('[Admin] Editing user RAW data:', user);
    this.selectedUser = JSON.parse(JSON.stringify(user)); // Deep clone
    this.isSaving = false; // Reset state
    
    // Safety bridge & Defensive Normalization (Plural to Singular)
    if (!this.selectedUser.group_permissions) this.selectedUser.group_permissions = {};
    if (!this.selectedUser.permissions) this.selectedUser.permissions = [];
    if (!this.selectedUser.group_ids) this.selectedUser.group_ids = [];

    // ENSURE keys for all groups exist to facilitate direct binding
    this.selectedUser.group_ids.forEach(gid => {
        if (!this.selectedUser.group_permissions![gid]) {
            this.selectedUser.group_permissions![gid] = [];
        }
    });

    // DEFENSIVE: Convert any 'users:view' to 'user:view' for checkboxes to be marked
    this.selectedUser.permissions = this.selectedUser.permissions.map(p => p === 'users:view' ? 'user:view' : p);
    
    for (const gid in this.selectedUser.group_permissions) {
        if (Array.isArray(this.selectedUser.group_permissions[gid])) {
            this.selectedUser.group_permissions[gid] = this.selectedUser.group_permissions[gid].map(p => p === 'users:view' ? 'user:view' : p);
        }
    }

    console.log('[Admin] SelectedUser state after init & normalization:', this.selectedUser);
    
    setTimeout(() => {
        this.userVisible = true;
        this.cdr.detectChanges();
    }, 0);
  }

  saveUser() {
    if (!this.selectedUser.name || !this.selectedUser.email) return;

    this.isSaving = true; // Lock state for dialog stability
    console.log('[Admin] Saving User. Final Permissions Array:', this.selectedUser.permissions);
    console.log('[Admin] Saving User. Group Permissions Map:', this.selectedUser.group_permissions);

    const obs$ = this.selectedUser.id 
        ? this.authService.updateUser(this.selectedUser as AppUser)
        : this.authService.addUser(this.selectedUser as AppUser);

    obs$.subscribe(() => {
        // 1. First, request dialog closure
        this.userVisible = false;
        
        // 2. Wait for dialogue to be removed from DOM before refreshing table
        setTimeout(() => {
            this.refreshData();
            this.cdr.detectChanges();
        }, 150);
    });
  }

  deleteUser(user: AppUser) {
    if (!confirm(`Are you sure you want to delete ${user.name}?`)) return;
    this.authService.deleteUser(user.id).subscribe(() => this.refreshData());
  }

  // ── GROUP CRUD ─────────────────────────────────
  newGroup() {
    this.selectedGroup = { name: '', description: '', icon: 'pi pi-folder', color: '#6366f1' };
    setTimeout(() => {
        this.groupVisible = true;
        this.cdr.detectChanges();
    }, 0);
  }

  editGroup(group: UserGroup) {
    this.selectedGroup = JSON.parse(JSON.stringify(group));
    setTimeout(() => {
        this.groupVisible = true;
        this.cdr.detectChanges();
    }, 0);
  }

  saveGroup() {
    if (!this.selectedGroup.name) return;

    // Sanitize payload: remove calculated fields or ID from the body
    const payload: Partial<UserGroup> = {
        name: this.selectedGroup.name,
        description: this.selectedGroup.description || '',
        icon: this.selectedGroup.icon || 'pi pi-folder',
        color: this.selectedGroup.color || '#6366f1'
    };

    const obs$ = this.selectedGroup.id
        ? this.groupService.updateGroup(this.selectedGroup.id, payload)
        : this.groupService.createGroup(payload);

    obs$.subscribe({
        next: () => {
            this.groupVisible = false;
            this.refreshData();
        },
        error: (err) => {
            console.error('[Admin] Error saving group:', err);
            // Minimal feedback could be added here later (e.g. Toast)
        }
    });
  }

  deleteGroup(group: UserGroup) {
      if (!confirm(`Delete group ${group.name}? This might affect tickets and users.`)) return;
      this.groupService.deleteGroup(group.id).subscribe(() => this.refreshData());
  }

  private EMPTY_PERMS: string[] = [];

  // ── PBAC HELPERS ───────────────────────────────
  getGroupName(groupId: string): string {
      const g = this.groups.find(x => x.id === groupId);
      return g ? g.name : 'Unknown Group';
  }

  getGroupPerms(groupId: string): string[] {
      if (!this.selectedUser || !this.selectedUser.group_permissions) return this.EMPTY_PERMS;
      return this.selectedUser.group_permissions[groupId] || this.EMPTY_PERMS;
  }

  getGroupColor(groupId: any): string {
      if (!groupId) return '#6466f1';
      const g = this.groups.find(x => x.id === groupId);
      return g?.color || '#6466f1';
  }

  updateGroupPerms(groupId: string, perms: string[]) {
      if (!this.selectedUser) return;
      if (!this.selectedUser.group_permissions) {
          this.selectedUser.group_permissions = {};
      }
      
      // Force change detection by creating a new object reference
      this.selectedUser.group_permissions = {
          ...this.selectedUser.group_permissions,
          [groupId]: perms
      };
      
      this.cdr.detectChanges();
  }
}