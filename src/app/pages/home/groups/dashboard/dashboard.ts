import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { SelectButtonModule } from 'primeng/selectbutton';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { AuthService, AppUser } from '../../../../services/auth.service';
import { TicketService, Ticket } from '../../../../services/ticket.service';
import { GroupService } from '../../../../services/group.service';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';

@Component({
  selector: 'app-group-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, CardModule, TagModule, DialogModule, InputTextModule, SelectModule, DragDropModule, TableModule, SelectButtonModule, IconFieldModule, InputIconModule, TooltipModule, HasPermissionDirective],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class GroupDashboardComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private ticketService = inject(TicketService);
  private groupService = inject(GroupService);
  private cdr = inject(ChangeDetectorRef);

  groupId: string | null = null;
  groupName: string = 'Loading...';

  viewMode: string = 'kanban';
  viewOptions = [
    { icon: 'pi pi-server', value: 'kanban' },
    { icon: 'pi pi-list', value: 'list' }
  ];

  // System Users for assignments
  systemUsers: AppUser[] = [];
  groupMembers: AppUser[] = [];
  membersVisible: boolean = false;

  // Modal logic for Add Ticket
  visible: boolean = false;
  newTicketTitle: string = '';
  newTicketDescription: string = '';
  newTicketStatus: string = '';
  newTicketPriority: string = '';
  newTicketAssignedTo: string | null = null;

  statuses: {name: string}[] = [
    { name: 'Pending' },
    { name: 'In Progress' },
    { name: 'Review' },
    { name: 'Done' }
  ];

  priorities = [
    { name: 'Lowest' },   
    { name: 'Very Low' }, 
    { name: 'Low' },      
    { name: 'Medium' },   
    { name: 'High' },     
    { name: 'Very High' },
    { name: 'Urgent' }    
  ];

  get currentUserId(): string {
    const user = this.authService.getCurrentUser();
    return user ? (user.id || '') : '';
  }

  get currentUserName(): string {
    const user = this.authService.getCurrentUser();
    return user ? user.name : 'Unknown User';
  }

  activeFilter: string = 'All';
  filters = ['All', 'My Tickets', 'Unassigned', 'High Priority'];

  tickets: Ticket[] = [];
  
  // Edited Ticket logic
  editingTicketId: string | null = null;
  newCommentText: string = '';
  editingTicketRef: Ticket | null = null;

  ngOnInit() {
    this.groupId = this.route.snapshot.paramMap.get('id');
    if (this.groupId) {
      // 1. Fetch Group Info
      this.groupService.getGroupById(this.groupId).subscribe(group => {
        this.groupName = group.name;
      });

      // 2. Fetch Users for the Dropdown and Group Membership
      this.authService.getUsers().subscribe(users => {
        this.systemUsers = users;
        this.filterGroupMembers();
      });

      // 3. Fetch Tickets
      this.loadTickets();
    }
  }

  filterGroupMembers() {
    if (!this.groupId) return;
    this.groupMembers = this.systemUsers.filter(u => {
        const groups = u.group_ids || [];
        return groups.includes(this.groupId!);
    });
  }

  removeMember(member: AppUser) {
    if (!this.groupId) return;
    if (!confirm(`¿Estás seguro de que deseas eliminar a ${member.name} de este grupo?`)) return;

    const updatedGroupIds = (member.group_ids || []).filter(id => id !== this.groupId);
    
    this.authService.updateUser({
        ...member,
        group_ids: updatedGroupIds
    }).subscribe({
        next: () => {
            // Actualizamos localmente
            member.group_ids = updatedGroupIds;
            this.filterGroupMembers();
            this.cdr.detectChanges();
        },
        error: (err) => {
            console.error('Error removing member:', err);
            alert('No se pudo eliminar al usuario del grupo.');
        }
    });
  }

  loadTickets() {
      if(!this.groupId) return;
      this.ticketService.getGroupTickets(this.groupId).subscribe(data => {
          this.tickets = data;
          this.cdr.detectChanges(); 
      });
  }
  
  getFilteredTickets(baseList: Ticket[]) {
    switch (this.activeFilter) {
      case 'My Tickets':
        return baseList.filter(t => t.assigned_to === this.currentUserId);
      case 'Unassigned':
        return baseList.filter(t => !t.assigned_to);
      case 'High Priority':
        return baseList.filter(t => ['High', 'Very High', 'Urgent'].includes(t.priority));
      case 'All':
      default:
        return baseList;
    }
  }

  get pendingTickets() { return this.getFilteredTickets(this.tickets.filter(t => t.status === 'Pending')); }
  get inProgressTickets() { return this.getFilteredTickets(this.tickets.filter(t => t.status === 'In Progress')); }
  get reviewTickets() { return this.getFilteredTickets(this.tickets.filter(t => t.status === 'Review')); }
  get doneTickets() { return this.getFilteredTickets(this.tickets.filter(t => t.status === 'Done')); }
  
  get filteredTicketsList() {
    return this.getFilteredTickets(this.tickets);
  }

  // Drag and drop handler
  drop(event: CdkDragDrop<any[]>, newStatus: string) {
    if (event.previousContainer !== event.container) {
      const item: Ticket = event.previousContainer.data[event.previousIndex];

      if (!this.hasTicketEditAccess(item) || !item.id) {
        return;
      }

      const oldStatus = item.status;
      const historyLog = [...(item.history || []), {
        action: `Status changed from ${oldStatus} to ${newStatus} by ${this.currentUserName}`,
        date: new Date().toISOString()
      }];

      // UI Optimistic Update
      const ticketToUpdate = this.tickets.find(t => t.id === item.id);
      if (ticketToUpdate) {
        ticketToUpdate.status = newStatus;
        ticketToUpdate.history = historyLog;
        this.tickets = [...this.tickets];
      }

      // Backend Persistence
      this.ticketService.updateTicket(item.id, { 
          status: newStatus,
          history: historyLog
      }).subscribe();
    }
  }

  get recentTickets() {
    return [...this.tickets].reverse().slice(0, 3);
  }

  getTicketSeverity(priority: string): 'success' | 'warn' | 'danger' | 'info' {
    switch (priority) {
      case 'Lowest':
      case 'Very Low':
      case 'Low': return 'success';
      case 'Medium': return 'info';
      case 'High':
      case 'Very High': return 'warn';
      case 'Urgent': return 'danger';
      default: return 'info';
    }
  }

  getUserName(userId: string | undefined): string {
    if (!userId) return 'Unassigned';
    const u = this.systemUsers.find(user => user.id === userId);
    return u ? u.name : 'Unknown';
  }

  goBack() {
    this.router.navigate(['/home/groups']);
  }

  goToSettings() {
    if (this.groupId) {
      this.router.navigate(['/home/groups', this.groupId, 'settings']);
    }
  }

  newTicket() {
    this.resetForm();
    this.newTicketStatus = 'Pending';
    this.newTicketPriority = 'Medium';
    this.visible = true;
  }

  editTicket(ticket: Ticket) {
    this.editingTicketId = ticket.id!;
    this.editingTicketRef = JSON.parse(JSON.stringify(ticket)); // clone
    this.newTicketTitle = ticket.title;
    this.newTicketDescription = ticket.description || '';
    this.newTicketStatus = ticket.status;
    this.newTicketPriority = ticket.priority;
    this.newTicketAssignedTo = ticket.assigned_to || null;
    this.newCommentText = '';
    this.visible = true;
  }

  canEditFull(): boolean {
    if (!this.editingTicketRef) return true; // new ticket mode
    if (this.authService.hasPermission('ticket:edit')) return true; // admins can do everything
    return this.currentUserId === this.editingTicketRef.created_by;
  }

  canEditPartial(): boolean {
    if (!this.editingTicketRef) return false;
    if (this.authService.hasPermission('ticket:edit')) return true;
    return this.currentUserId === this.editingTicketRef.assigned_to;
  }

  hasTicketEditAccess(ticket: Ticket): boolean {
    if (this.authService.hasPermission('ticket:edit')) return true;
    return this.currentUserId === ticket.assigned_to;
  }

  addComment() {
    if (this.newCommentText.trim() && this.editingTicketRef && this.editingTicketId) {
      const today = new Date().toISOString();
      const newComment = {
        author: this.currentUserName,
        text: this.newCommentText,
        date: today
      };
      
      const updatedComments = [...(this.editingTicketRef.comments || []), newComment];
      const updatedHistory = [...(this.editingTicketRef.history || []), {
         action: `Comment added by ${this.currentUserName}`,
         date: today
      }];

      this.ticketService.updateTicket(this.editingTicketId, {
          comments: updatedComments,
          history: updatedHistory
      }).subscribe(() => {
          this.loadTickets(); // Reload list to get fresh comments
          this.editingTicketRef!.comments = updatedComments;
          this.editingTicketRef!.history = updatedHistory;
          this.newCommentText = '';
      });
    }
  }

  saveTicket() {
    const today = new Date().toISOString();
    
    if (this.editingTicketId && this.editingTicketRef) {
      // Update existing ticket
      const payload: Partial<Ticket> = {
          status: this.newTicketStatus || 'Pending'
      };

      if (this.canEditFull()) {
          payload.title = this.newTicketTitle;
          payload.description = this.newTicketDescription;
          payload.priority = this.newTicketPriority || 'Medium';
          payload.assigned_to = this.newTicketAssignedTo || undefined;
      }

      const historyLog = [...(this.editingTicketRef.history || [])];
      if (this.editingTicketRef.status !== payload.status) {
          historyLog.push({ action: `Status changed to ${payload.status}`, date: today });
      }
      if (this.canEditFull() && (this.editingTicketRef.title !== payload.title || this.editingTicketRef.description !== payload.description)) {
          historyLog.push({ action: `Ticket details updated by ${this.currentUserName}`, date: today });
      }

      payload.history = historyLog;

      this.ticketService.updateTicket(this.editingTicketId, payload).subscribe(() => {
          this.loadTickets();
          this.visible = false;
      });

    } else {
      // Create new ticket
      if(!this.groupId) return;

      const newTicket: Omit<Ticket, 'id'|'created_on'> = {
        group_id: this.groupId,
        title: this.newTicketTitle.trim(),
        description: this.newTicketDescription,
        status: this.newTicketStatus || 'Pending',
        priority: this.newTicketPriority || 'Medium',
        assigned_to: this.newTicketAssignedTo || undefined,
        created_by: this.currentUserId,
        comments: [],
        history: [{action: `Ticket created by ${this.currentUserName}`, date: today}]
      };

      this.ticketService.createTicket(newTicket).subscribe({
          next: () => {
              this.loadTickets();
              this.visible = false;
          },
          error: (err) => {
              console.error("Failed to create ticket:", err);
              alert("Error al crear ticket: " + (err.error?.error || err.message));
          }
      });
    }
  }

  resetForm() {
    this.editingTicketId = null;
    this.editingTicketRef = null;
    this.newTicketTitle = '';
    this.newTicketDescription = '';
    this.newTicketStatus = '';
    this.newTicketPriority = '';
    this.newTicketAssignedTo = null;
    this.newCommentText = '';
  }
}
