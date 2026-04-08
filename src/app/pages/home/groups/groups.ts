import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { CommonModule } from '@angular/common';
import { SelectModule } from 'primeng/select';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { AuthService, UserGroup } from '../../../services/auth.service';
import { GroupService } from '../../../services/group.service';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';

@Component({
  selector: 'app-groups',
  standalone: true,
  imports: [ButtonModule, DialogModule, InputTextModule, FormsModule, ToggleSwitchModule, CommonModule, SelectModule, HasPermissionDirective, ConfirmDialogModule, ToastModule],
  providers: [ConfirmationService, MessageService],
  templateUrl: './groups.html',
  styleUrl: './groups.css'
})

export class GroupsComponent implements OnInit {
  authService = inject(AuthService);
  groupService = inject(GroupService);
  router = inject(Router);
  cdr = inject(ChangeDetectorRef);
  confirmationService = inject(ConfirmationService);
  messageService = inject(MessageService);

  visible: boolean = false;
  editingGroupId: string | null = null;
  newGroupName: string = '';
  newGroupDescription: string = '';

  groupsData: UserGroup[] = [];

  ngOnInit() {
    this.loadGroups();
  }

  loadGroups() {
    this.groupService.getGroups().subscribe({
        next: (g) => {
            console.log("Groups loaded ok: ", g);
            this.groupsData = g;
            
            // UPDATE STATS DYNAMICALLY
            const totalGroups = this.groupsData.length;
            const totalMembers = this.groupsData.reduce((acc, curr) => acc + (curr.members || 0), 0);
            
            this.stats = [
              { label: 'Total Groups', value: totalGroups, icon: 'pi pi-sitemap', color: '#22c55e' },
              { label: 'Total Members', value: totalMembers, icon: 'pi pi-users', color: '#6366f1' },
            ];

            this.cdr.detectChanges(); // Forzar actualización visual
        },
        error: (err) => {
            console.error("Error loading groups:", err);
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Could not load groups' });
        }
    });
  }

  // ── STATS ──────────────────────────────────────
  stats = [
    { label: 'Total Groups', value: 0,  icon: 'pi pi-sitemap',color: '#22c55e' },
    { label: 'Total Members', value: 0, icon: 'pi pi-users',   color: '#6366f1' },
  ];

  // ── GROUPS ─────────────────────────────────────
  get groups() {
    return this.groupsData;
  }

  newGroup() {
    this.editingGroupId = null;
    this.newGroupName = '';
    this.newGroupDescription = '';
    this.visible = true;
  }
  
  editGroup(group: UserGroup) {
    this.editingGroupId = group.id;
    this.newGroupName = group.name;
    this.newGroupDescription = group.description || '';
    this.visible = true;
  }

  saveGroup() {
    const payload = {
      name: this.newGroupName,
      description: this.newGroupDescription,
      color: '#6366f1',
      icon: 'pi pi-folder'
    };

    if (this.editingGroupId) {
      this.groupService.updateGroup(this.editingGroupId, payload).subscribe({
        next: () => {
             this.visible = false;
             this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Group updated successfully' });
             this.loadGroups();
         },
         error: (err) => {
             console.error(err);
             this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.error || err.message });
         }
      });
    } else {
      this.groupService.createGroup(payload).subscribe({
         next: () => {
             this.visible = false;
             this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Group created successfully' });
             this.loadGroups();
         },
         error: (err) => {
             console.error(err);
             this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.error || err.message });
         }
      });
    }
  }

  confirmDeleteGroup(group: UserGroup) {
    this.confirmationService.confirm({
      message: `Are you sure that you want to delete the group "${group.name}"? This action cannot be undone.`,
      header: 'Delete Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.groupService.deleteGroup(group.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Group deleted successfully' });
            this.loadGroups();
          },
          error: (err) => {
            console.error(err);
            this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.error || err.message });
          }
        });
      }
    });
  }

  goToDashboard(groupId: string) {
    this.router.navigate(['/home/groups', groupId, 'dashboard']);
  }
}
