import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-group-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule, ButtonModule, InputTextModule, TableModule, TagModule, ConfirmDialogModule],
  providers: [ConfirmationService, MessageService],
  templateUrl: './settings.html',
  styleUrl: './settings.css'
})
export class GroupSettingsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  groupId: string | null = null;
  groupName: string = '';
  newMemberEmail: string = '';

  // Mock roles for UI demonstration
  currentUserRole = 'Admin'; // Could be 'Admin' or 'Member'

  members = [
    { id: 1, name: 'Admin User', email: 'admin@example.com', role: 'Owner' },
    { id: 2, name: 'John Doe', email: 'john.doe@example.com', role: 'Member' },
    { id: 3, name: 'Jane Smith', email: 'jane.smith@example.com', role: 'Member' }
  ];

  ngOnInit() {
    this.groupId = this.route.snapshot.paramMap.get('id');
    if (this.groupId) {
      this.groupName = this.groupId.charAt(0).toUpperCase() + this.groupId.slice(1);
    }
  }

  get canEdit() {
    return this.currentUserRole === 'Admin';
  }

  saveSettings() {
    if (this.canEdit) {
      this.messageService.add({severity:'success', summary:'Success', detail:'Group settings saved successfully.'});
    }
  }

  addMember() {
    if (this.newMemberEmail.trim() && this.canEdit) {
      this.members.push({
        id: this.members.length + 1,
        name: 'New User',
        email: this.newMemberEmail,
        role: 'Member'
      });
      this.newMemberEmail = '';
      this.messageService.add({severity:'info', summary:'Invited', detail:'User invited successfully.'});
    }
  }

  removeMember(memberId: number) {
    if (this.canEdit) {
      this.members = this.members.filter(m => m.id !== memberId);
      this.messageService.add({severity:'warn', summary:'Removed', detail:'Member removed from group.'});
    }
  }

  confirmDelete() {
    if (!this.canEdit) return;
    
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this group? This action cannot be undone.',
      header: 'Delete Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.messageService.add({severity:'error', summary:'Deleted', detail:'Group deleted successfully.'});
        setTimeout(() => this.router.navigate(['/home/groups']), 1000);
      }
    });
  }

  goBack() {
    this.router.navigate(['/home/groups', this.groupId, 'dashboard']);
  }
}
