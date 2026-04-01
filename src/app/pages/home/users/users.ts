import { Component, OnInit, inject } from '@angular/core';
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
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  // ── ROLES ──────────────────────────────────────
  roles = [
    { name: 'Admin', description: 'Full access to all features', color: '#6366f1' },
    { name: 'User',  description: 'Limited access to features', color: '#22c55e' },
    { name: 'Guest', description: 'Read-only access', color: '#0ea5e9' },
  ];

  ngOnInit() {
    // Server logic check goes here
  }

  // ── GROUPS ──────────────────────────────────────
  groups = [
    { name: 'Management', members: 2, description: 'Executive and administrative staff', color: '#6366f1' },
    { name: 'Sales',      members: 2, description: 'Sales representatives and account managers', color: '#22c55e' },
    { name: 'Support',    members: 2, description: 'Customer support and helpdesk team', color: '#0ea5e9' },
  ];


  visible: boolean = false;
  editingUserId: number | null = null;

  newUserName: string = '';
  newUserEmail: string = '';
  newUserPassword: string = '';
  newUserRole: string = '';
  newUserGroup: string = '';
  newUserStatus: string = 'Active';
  newUserJoined: string = '';

  // ── STATS ──────────────────────────────────────
  stats = [
    { label: 'Total Users',  value: 6,  icon: 'pi pi-users',  color: '#6366f1' },
    { label: 'Active',       value: 4,  icon: 'pi pi-check',  color: '#0ea5e9' },
    { label: 'Inactive',     value: 2,  icon: 'pi pi-times',  color: '#f97316' },
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
    return this.authService.getUsers();
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
        this.authService.deleteUser(user.id);
        this.messageService.add({severity:'success', summary:'Deleted', detail:'User removed successfully.'});
      }
    });
  }

  saveUser() {
    if (!this.newUserName || !this.newUserEmail || !this.newUserRole || !this.newUserGroup) {
        this.messageService.add({severity:'warn', summary:'Validation', detail:'Please fill out all required fields.'});
        return;
    }

    // Extract selected permissions
    const selectedPerms = Object.keys(this.newUserPerms).filter(k => this.newUserPerms[k]);

    if (this.editingUserId) {
        // Update existing user
        this.authService.updateUser({
            id: this.editingUserId,
            name: this.newUserName,
            email: this.newUserEmail,
            password: this.newUserPassword,
            role: this.newUserRole,
            group: this.newUserGroup,
            status: this.newUserStatus,
            joined: this.newUserJoined,
            permissions: selectedPerms
        });
        this.messageService.add({severity:'success', summary:'Success', detail:'User updated successfully.'});
    } else {
        // Create new
        const currentUsers = this.authService.getUsers();
        const newId = currentUsers.length > 0 ? Math.max(...currentUsers.map(u => u.id)) + 1 : 1;
        this.authService.addUser({
            id: newId,
            name: this.newUserName,
            email: this.newUserEmail,
            password: this.newUserPassword,
            role: this.newUserRole,
            group: this.newUserGroup,
            status: this.newUserStatus,
            joined: this.newUserJoined,
            permissions: selectedPerms
        });
        this.messageService.add({severity:'success', summary:'Success', detail:'User created successfully.'});
    }
    
    this.resetForm();
    this.visible = false;
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