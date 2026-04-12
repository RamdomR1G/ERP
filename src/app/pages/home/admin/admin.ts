import { Component, ChangeDetectorRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TabsModule } from 'primeng/tabs';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { ChipModule } from 'primeng/chip';
import { CardModule } from 'primeng/card';
import { TooltipModule } from 'primeng/tooltip';
import { AuthService, AppUser, UserGroup } from '../../../services/auth.service';
import { GroupService } from '../../../services/group.service';
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
    TabsModule, 
    DialogModule, 
    InputTextModule, 
    SelectModule, 
    MultiSelectModule, 
    ChipModule, 
    CardModule, 
    TooltipModule,
    HasPermissionDirective
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
  
  selectedUser: Partial<AppUser> = {};
  selectedGroup: Partial<UserGroup> = {};

  availableRoles = [{label: 'Admin', value: 'Admin'}, {label: 'User', value: 'User'}, {label: 'Manager', value: 'Manager'}];
  availableStatuses = [{label: 'Active', value: 'Active'}, {label: 'Inactive', value: 'Inactive'}];
  
  // Posibles permisos granulares para el selector
  allPermissions = [
    'ticket:view', 'ticket:add', 'ticket:edit', 'ticket:delete', 'ticket:move',
    'group:view', 'users:view', '*'
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
      this.groups = (res.groups as any).data || res.groups; // Handle unwrapped or raw
      this.calculateStats();
      this.cdr.detectChanges();
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
        group_permissions: {} 
    };
    this.userVisible = true;
  }

  editUser(user: AppUser) {
    this.selectedUser = JSON.parse(JSON.stringify(user)); // Deep clone
    if (!this.selectedUser.group_permissions) {
        this.selectedUser.group_permissions = {};
    }
    this.userVisible = true;
  }

  saveUser() {
    if (!this.selectedUser.name || !this.selectedUser.email) return;

    const obs$ = this.selectedUser.id 
        ? this.authService.updateUser(this.selectedUser as AppUser)
        : this.authService.addUser(this.selectedUser as AppUser);

    obs$.subscribe(() => {
        this.userVisible = false;
        this.refreshData();
    });
  }

  deleteUser(user: AppUser) {
    if (!confirm(`Are you sure you want to delete ${user.name}?`)) return;
    this.authService.deleteUser(user.id).subscribe(() => this.refreshData());
  }

  // ── GROUP CRUD ─────────────────────────────────
  newGroup() {
    this.selectedGroup = { name: '', description: '', icon: 'pi pi-folder', color: '#6366f1' };
    this.groupVisible = true;
  }

  editGroup(group: UserGroup) {
    this.selectedGroup = JSON.parse(JSON.stringify(group));
    this.groupVisible = true;
  }

  saveGroup() {
    if (!this.selectedGroup.name) return;

    const obs$ = this.selectedGroup.id
        ? this.groupService.updateGroup(this.selectedGroup.id, this.selectedGroup)
        : this.groupService.createGroup(this.selectedGroup);

    obs$.subscribe(() => {
        this.groupVisible = false;
        this.refreshData();
    });
  }

  deleteGroup(group: UserGroup) {
      if (!confirm(`Delete group ${group.name}? This might affect tickets and users.`)) return;
      this.groupService.deleteGroup(group.id).subscribe(() => this.refreshData());
  }

  // ── PBAC HELPERS ───────────────────────────────
  getGroupName(groupId: string): string {
      const g = this.groups.find(x => x.id === groupId);
      return g ? g.name : 'Unknown Group';
  }

  getGroupPerms(groupId: string): string[] {
      if (!this.selectedUser.group_permissions) return [];
      return this.selectedUser.group_permissions[groupId] || [];
  }

  updateGroupPerms(groupId: string, perms: string[]) {
      if (!this.selectedUser.group_permissions) this.selectedUser.group_permissions = {};
      this.selectedUser.group_permissions[groupId] = perms;
  }
}