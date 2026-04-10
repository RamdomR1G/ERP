import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { forkJoin } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { CheckboxModule } from 'primeng/checkbox';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { PasswordModule } from 'primeng/password';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AuthService, AppUser } from '../../../services/auth.service';
import { GroupService } from '../../../services/group.service';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, 
    FormsModule, TableModule, ButtonModule, 
    TagModule, DialogModule, InputTextModule, 
    SelectModule, MultiSelectModule, CheckboxModule, ToggleSwitchModule, PasswordModule, HasPermissionDirective,
    ConfirmDialogModule, ToastModule],
  providers: [ConfirmationService, MessageService],
  templateUrl: './users.html',
  styleUrl: './users.css'
})
export class UsersComponent implements OnInit {
  authService = inject(AuthService);
  groupService = inject(GroupService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private cdr = inject(ChangeDetectorRef);

  // ── ROLES ──────────────────────────────────────
  roles = [
    { name: 'Admin', description: 'Full access to all features', color: '#6366f1' },
    { name: 'User',  description: 'Limited access to features', color: '#22c55e' },
    { name: 'Guest', description: 'Read-only access', color: '#0ea5e9' },
  ];

  ngOnInit() {
    forkJoin({
        groups: this.groupService.getGroups(),
        users: this.authService.getUsers()
    }).subscribe({
        next: (res) => {
            this.groups = res.groups;
            
            this.usersList = res.users.map(u => {
                let assignedGroups: string[] = [];
                let rawGroupIds = (u as any).group_ids || [];
                // Compatibilidad migratoria si un usuario aún trae el viejo group_id en vez del nuevo
                if (!Array.isArray(rawGroupIds) && (u as any).group_id) {
                    rawGroupIds = [(u as any).group_id];
                }
                
                if (Array.isArray(rawGroupIds)) {
                    assignedGroups = rawGroupIds.map((id: string) => {
                        const matched = this.groups.find(g => g.id === id);
                        return matched ? matched.name : id;
                    });
                }

                return { 
                    ...u, 
                    group_names: assignedGroups,
                    group_ids: rawGroupIds,
                    group_permissions: (u as any).group_permissions || {},
                    joined: u.joined_date ? new Date(u.joined_date).toLocaleDateString() : u.joined 
                };
            });
            this.updateStats();
            this.cdr.detectChanges();
        },
        error: (err) => this.messageService.add({severity:'error', summary:'Error', detail:'Failed to load data.'})
    });
  }

  updateStats() {
    const total = this.usersList.length;
    const active = this.usersList.filter(u => u.status === 'Active').length;
    const inactive = total - active;
    this.stats = [
      { label: 'Total Users',  value: total,  icon: 'pi pi-users',  color: '#6366f1' },
      { label: 'Active',       value: active, icon: 'pi pi-check',  color: '#0ea5e9' },
      { label: 'Inactive',     value: inactive, icon: 'pi pi-times',  color: '#f97316' },
    ];
  }

  // ── GROUPS ──────────────────────────────────────
  groups: any[] = [];


  visible: boolean = false;
  editingUserId: string | null = null;
  usersList: AppUser[] = [];

  newUserName: string = '';
  newUserEmail: string = '';
  newUserPassword: string = '';
  newUserRole: string = '';
  newUserGroupIds: string[] = [];
  newUserStatus: string = 'Active';
  newUserJoined: string = '';

  // ── PERMISSIONS SYSTEM ──────────────────────
  // Data Map: { [groupId]: ["perm1", "perm2"] }
  newUserGroupPermissions: { [key: string]: string[] } = {};
  
  // UI State: { [permId]: true/false } - This binds directly to switches
  permissionCheckboxes: { [key: string]: boolean } = {};
  
  permissionConfigGroup: string | null = null; // Currently selected context in modal dropdown

  // ── STATS ──────────────────────────────────────
  stats = [
    { label: 'Total Users',  value: 0,  icon: 'pi pi-users',  color: '#6366f1' },
    { label: 'Active',       value: 0,  icon: 'pi pi-check',  color: '#0ea5e9' },
    { label: 'Inactive',     value: 0,  icon: 'pi pi-times',  color: '#f97316' },
  ];

  // ── PERMISSIONS MATRIX ────────────────────────
  permissionCategories = [
    {
      name: 'Tickets',
      perms: [
        { id: 'ticket:view', label: 'View Tickets' },
        { id: 'ticket:add', label: 'Create Tickets' },
        { id: 'ticket:edit', label: 'Master Edit Tickets' },
        { id: 'ticket:edit_state', label: 'Move Assigned Tickets' },
        { id: 'ticket:delete', label: 'Delete Tickets' },
      ]
    },
    {
      name: 'Users',
      perms: [
        { id: 'users:view', label: 'View Users' },
        { id: 'user:add', label: 'Create Users' },
        { id: 'user:edit', label: 'Edit Users' },
        { id: 'user:delete', label: 'Delete Users' },
      ]
    },
    {
      name: 'Groups',
      perms: [
        { id: 'group:view', label: 'View Groups' },
        { id: 'group:add', label: 'Create Groups' },
        { id: 'group:edit', label: 'Edit Groups' },
        { id: 'group:delete', label: 'Delete Groups' },
      ]
    }
  ];

  newUserPerms: { [key: string]: boolean } = {};

  selectedGroupId: string | null = null;

  // ── USERS ──────────────────────────────────────
  get users(): AppUser[] {
    if (!this.selectedGroupId) return this.usersList;
    return this.usersList.filter(u => {
        const ids = u.group_ids || [];
        return ids.includes(this.selectedGroupId!);
    });
  }

  getUserSeverity(status: string): 'success' | 'danger' {
    return status === 'Active' ? 'success' : 'danger';
  }

  // Helper to get group name for permission dropdown
  getAssignedGroupsDetails() {
    const assignedGroups = this.groups.filter(g => this.newUserGroupIds.includes(g.id));
    
    const results = [
        { id: 'global', name: 'Global (All workspaces)' },
        ...assignedGroups
    ];
    
    // Add visual indicator to name if it has permissions in the map
    return results.map(item => {
        const perms = this.newUserGroupPermissions[item.id] || [];
        const hasPerms = perms.length > 0;
        return {
            ...item,
            name: hasPerms ? `✓ ${item.name}` : item.name
        };
    });
  }

  // Logic to load checkboxes from the current group's permissions
  loadPermissionsToCheckboxes() {
    // 1. Reset ALL to false first (Explicitly)
    const newState: { [key: string]: boolean } = {};
    this.permissionCategories.forEach(cat => {
      cat.perms.forEach(p => {
        newState[p.id] = false;
      });
    });

    // 2. Turn ON only the ones in the map
    if (this.permissionConfigGroup) {
      const activePerms = this.newUserGroupPermissions[this.permissionConfigGroup] || [];
      
      // If Admin/Wildcard
      if (activePerms.includes('*') || activePerms.includes('admin')) {
        Object.keys(newState).forEach(k => newState[k] = true);
      } else {
        activePerms.forEach(p => {
          newState[p] = true;
        });
      }
    }
    
    // 3. Replace the WHOLE object to trigger Angular's change detection
    this.permissionCheckboxes = newState;
    console.log(`[Users] UI State sync for ${this.permissionConfigGroup}:`, this.permissionCheckboxes);
    this.cdr.detectChanges();
  }

  // Logic to save checkboxes back to the data map
  onTogglePerm() {
    if (this.permissionConfigGroup) {
      this.newUserGroupPermissions[this.permissionConfigGroup] = 
        Object.keys(this.permissionCheckboxes).filter(k => this.permissionCheckboxes[k]);
      
      console.log(`[Users] Updated data map:`, this.newUserGroupPermissions);
      this.cdr.detectChanges();
    }
  }

  onGroupConfigChange() {
    this.loadPermissionsToCheckboxes();
  }

  updateCurrentGroupPerms() {
    // This is now handled by onTogglePerm in real-time
  }

  newUser() {
    this.resetForm();
    this.editingUserId = null;
    this.newUserStatus = 'Active';
    // Let's set the joined date automatically for new users
    const today = new Date();
    this.newUserJoined = today.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    this.visible = true;
  }

  editUser(user: AppUser) {
    this.editingUserId = user.id;
    this.newUserName = user.name;
    this.newUserEmail = user.email;
    this.newUserPassword = user.password || '';
    this.newUserRole = user.role;
    this.newUserGroupIds = Array.isArray(user.group_ids) ? user.group_ids : ((user as any).group_id ? [(user as any).group_id] : []);
    this.newUserStatus = user.status;
    this.newUserJoined = user.joined;
    
    // SAFE PARSING of group_permissions
    try {
        let raw = (user as any).group_permissions;
        if (typeof raw === 'string') {
            this.newUserGroupPermissions = JSON.parse(raw);
        } else {
            this.newUserGroupPermissions = raw || {};
        }
    } catch (e) {
        console.error('[Users] Error parsing group_permissions:', e);
        this.newUserGroupPermissions = {};
    }
    
    // Default to 'global' view
    this.permissionConfigGroup = 'global';
    
    // Trigger load to UI
    this.loadPermissionsToCheckboxes();

    this.visible = true;
  }

  deleteUser(user: AppUser) {
    if (user.email === 'superadmin@erp.com') {
      this.messageService.add({severity:'error', summary:'Denied', detail:'Cannot delete the Super Admin account.'});
      return;
    }

    this.confirmationService.confirm({
      message: `Are you sure you want to delete user ${user.name}?`,
      header: 'Delete Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.authService.deleteUser(user.id).subscribe({
          next: () => {
             this.messageService.add({severity:'success', summary:'Deleted', detail:'User removed successfully.'});
             this.ngOnInit();
          },
          error: (err) => {
              const errorMsg = err.error?.error || err.message || 'Failed to remove user.';
              // Detect foreign key constraint dynamically
              if (errorMsg.includes('foreign key constraint') || errorMsg.includes('violates foreign key')) {
                  this.messageService.add({severity:'error', summary:'Error', detail: 'This user cannot be deleted because they are assigned to tickets or groups. Reassign their work first.'});
              } else {
                  this.messageService.add({severity:'error', summary:'Error', detail: errorMsg});
              }
          }
        });
      }
    });
  }

  saveUser() {
    if (!this.newUserName || !this.newUserEmail || !this.newUserRole || this.newUserGroupIds.length === 0) {
        this.messageService.add({severity:'warn', summary:'Validation', detail:'Please fill out all required fields and select at least one group.'});
        return;
    }

    if (!this.editingUserId && (!this.newUserPassword || this.newUserPassword.length < 8)) {
        this.messageService.add({severity:'warn', summary:'Validation', detail:'Password must be at least 8 characters.'});
        return;
    }
    
    // Sync the current view of permissions before saving
    this.updateCurrentGroupPerms();
    
    // Ensure group_ids is pure UUIDs
    let safeGroupIds = this.newUserGroupIds.map(val => {
        const isName = this.groups.find(g => g.name === val);
        return isName ? isName.id : val;
    });

    const payload: AppUser = {
      id: this.editingUserId || '',
      name: this.newUserName,
      email: this.newUserEmail,
      password: this.newUserPassword,
      role: this.newUserRole,
      group_ids: safeGroupIds,
      group_permissions: this.newUserGroupPermissions,
      status: this.newUserStatus,
      joined: this.newUserJoined,
      permissions: [] // Legacy field, keeping empty
    };

    const handleError = (err: any) => {
        let msg = err.error?.error || 'Failed to process';
        if (err.error?.details) {
            msg += ': ' + JSON.stringify(err.error.details.map((e:any) => e.message));
        }
        this.messageService.add({severity:'error', summary:'Error', detail: msg});
    };

    if (this.editingUserId) {
        // Update existing user
        this.authService.updateUser(payload).subscribe({
          next: () => {
             this.messageService.add({severity:'success', summary:'Success', detail:'User updated successfully.'});
             this.loadUsers(); 
             this.resetForm();
             this.visible = false;
          },
          error: handleError
        });
    } else {
        // Create new
        this.authService.addUser(payload).subscribe({
          next: () => {
             this.messageService.add({severity:'success', summary:'Success', detail:'User created successfully.'});
             this.loadUsers(); 
             this.resetForm();
             this.visible = false;
          },
          error: handleError
        });
    }
  }

  loadUsers() {
    this.authService.getUsers().subscribe({
      next: (users) => {
        this.usersList = users.map(u => {
          let assignedGroups: string[] = [];
          let rawGroupIds = (u as any).group_ids || [];
          if (!Array.isArray(rawGroupIds) && (u as any).group_id) {
            rawGroupIds = [(u as any).group_id];
          }
          if (Array.isArray(rawGroupIds)) {
            assignedGroups = rawGroupIds.map((id: string) => {
              const matched = this.groups.find(g => g.id === id);
              return matched ? matched.name : id;
            });
          }
          return { 
            ...u, 
            group_names: assignedGroups,
            group_ids: rawGroupIds,
            group_permissions: (u as any).group_permissions || {},
            joined: u.joined_date ? new Date(u.joined_date).toLocaleDateString() : u.joined 
          };
        });
        this.updateStats();
        this.cdr.detectChanges();
      },
      error: (err) => this.messageService.add({severity:'error', summary:'Error', detail:'Failed to refresh list.'})
    });
  }

  resetForm() {
    this.editingUserId = null;
    this.newUserName = '';
    this.newUserEmail = '';
    this.newUserPassword = '';
    this.newUserRole = '';
    this.newUserGroupIds = [];
    this.newUserStatus = 'Active';
    this.newUserJoined = '';
    this.newUserPerms = {};
    this.newUserGroupPermissions = {};
    this.permissionCheckboxes = {};
    this.permissionConfigGroup = null;
  }
}