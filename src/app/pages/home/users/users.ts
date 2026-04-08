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
    SelectModule, CheckboxModule, ToggleSwitchModule, PasswordModule, HasPermissionDirective,
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
                const groupObj = this.groups.find(g => g.id === (u as any).group_id);
                return { 
                    ...u, 
                    group: groupObj ? groupObj.name : ((u as any).group_id || u.group),
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
  newUserGroup: string = '';
  newUserStatus: string = 'Active';
  newUserJoined: string = '';

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

  // ── USERS ──────────────────────────────────────
  get users(): AppUser[] {
    return this.usersList;
  }

  getUserSeverity(status: string): 'success' | 'danger' {
    return status === 'Active' ? 'success' : 'danger';
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
    this.newUserGroup = user.group;
    this.newUserStatus = user.status;
    this.newUserJoined = user.joined;
    
    this.newUserPerms = {};
    if (user.permissions) {
      user.permissions.forEach(p => this.newUserPerms[p] = true);
    }
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
    if (!this.newUserName || !this.newUserEmail || !this.newUserRole || !this.newUserGroup) {
        this.messageService.add({severity:'warn', summary:'Validation', detail:'Please fill out all required fields.'});
        return;
    }

    if (!this.editingUserId && (!this.newUserPassword || this.newUserPassword.length < 8)) {
        this.messageService.add({severity:'warn', summary:'Validation', detail:'Password must be at least 8 characters.'});
        return;
    }

    // Extract selected permissions
    const selectedPerms = Object.keys(this.newUserPerms).filter(k => this.newUserPerms[k]);
    
    // Find missing group UUID back from group Name if the component loaded it differently on edits
    let safeGroupId = this.newUserGroup;
    const isName = this.groups.find(g => g.name === this.newUserGroup);
    if(isName) safeGroupId = isName.id;

    const payload: AppUser = {
      id: this.editingUserId || '',
      name: this.newUserName,
      email: this.newUserEmail,
      password: this.newUserPassword,
      role: this.newUserRole,
      group: safeGroupId,
      status: this.newUserStatus,
      joined: this.newUserJoined,
      permissions: selectedPerms
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
             this.ngOnInit();
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
             this.ngOnInit();
             this.resetForm();
             this.visible = false;
          },
          error: handleError
        });
    }
  }

  resetForm() {
    this.editingUserId = null;
    this.newUserName = '';
    this.newUserEmail = '';
    this.newUserPassword = '';
    this.newUserRole = '';
    this.newUserGroup = '';
    this.newUserStatus = 'Active';
    this.newUserJoined = '';
    this.newUserPerms = {};
  }
}