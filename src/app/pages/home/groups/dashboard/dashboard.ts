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
import { ChartModule } from 'primeng/chart';
import { DividerModule } from 'primeng/divider';
import { DatePicker } from 'primeng/datepicker';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ActivatedRoute, Router } from '@angular/router';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { AuthService, AppUser } from '../../../../services/auth.service';
import { TicketService, Ticket } from '../../../../services/ticket.service';
import { GroupService } from '../../../../services/group.service';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';

@Component({
  selector: 'app-group-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ButtonModule, 
    CardModule, 
    TagModule, 
    DialogModule, 
    InputTextModule, 
    SelectModule, 
    DragDropModule, 
    TableModule, 
    SelectButtonModule, 
    IconFieldModule, 
    InputIconModule, 
    TooltipModule, 
    HasPermissionDirective, 
    ChartModule,
    DividerModule,
    DatePicker,
    ConfirmDialogModule
  ],
  providers: [ConfirmationService],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class GroupDashboardComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public authService = inject(AuthService);
  private ticketService = inject(TicketService);
  private groupService = inject(GroupService);
  private cdr = inject(ChangeDetectorRef);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  // Core Properties (Restored)
  public groupId: string | null = null;
  public groupName: string = 'Loading...';
  public viewMode: string = 'kanban';
  public ticketSearchTerm = ''; // Type inferred

  // Member Management Hub logic
  public groupMembers: AppUser[] = [];
  public systemUsers: AppUser[] = [];
  public membersVisible: boolean = false;

  // Modal logic for Add Ticket
  visible: boolean = false;
  newTicketTitle: string = '';
  newTicketDescription: string = '';
  newTicketStatus: string = '';
  newTicketPriority: string = '';
  newTicketDeadline: Date | null = null;
  newTicketAssignedTo: string | null = null;
  isSaving: boolean = false;

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

  // ── CHARTS ──────────────────────────────────────
  statusChartData: any;
  statusChartOptions: any;
  priorityChartData: any;
  priorityChartOptions: any;
  
  // Edited Ticket logic
  editingTicketId: string | null = null;
  newCommentText: string = '';
  editingTicketRef: Ticket | null = null;

  ngOnInit() {
    this.groupId = this.route.snapshot.paramMap.get('id');
    if (this.groupId) {
      this.initCharts();
      // 1. Fetch Group Info
      this.groupService.getGroupById(this.groupId).subscribe(group => {
        this.groupName = group.name;
        this.cdr.detectChanges();
      });

      // 2. Fetch Users for the Dropdown and Group Membership
      this.authService.getUsers().subscribe(users => {
        this.systemUsers = users;
        this.filterGroupMembers();
        this.cdr.detectChanges();
      });

      // 3. Fetch Tickets
      this.loadTickets();
    }
  }

  initCharts() {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color');

    this.statusChartOptions = {
        plugins: {
            legend: { labels: { usePointStyle: true, color: textColor } }
        },
        responsive: true,
        maintainAspectRatio: false
    };

    this.priorityChartOptions = {
        maintainAspectRatio: false,
        aspectRatio: 0.8,
        plugins: {
            legend: { labels: { color: textColor } }
        },
        scales: {
            x: { grid: { color: 'rgba(255,255,255,0.1)', drawBorder: false }, ticks: { color: textColor } },
            y: { grid: { color: 'rgba(255,255,255,0.1)', drawBorder: false }, ticks: { color: textColor } }
        }
    };
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
            this.messageService.add({ severity: 'success', summary: 'Member Removed', detail: `${member.name} has been removed from the team.` });
            this.cdr.detectChanges();
        },
        error: (err) => {
            console.error('Error removing member:', err);
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Could not remove member from group.' });
        }
    });
  }

  loadTickets() {
      if(!this.groupId) return;
      this.ticketService.getGroupTickets(this.groupId).subscribe(data => {
          this.tickets = data;
          this.updateCharts();
          this.cdr.detectChanges(); 
      });
  }

  updateCharts() {
    const statuses = ['Pending', 'In Progress', 'Review', 'Done'];
    const statusCounts = statuses.map(s => this.tickets.filter(t => t.status === s).length);

    this.statusChartData = {
        labels: statuses,
        datasets: [{
            data: statusCounts,
            backgroundColor: ['#f97316', '#3b82f6', '#a855f7', '#22c55e']
        }]
    };

    const priorities = ['High', 'Medium', 'Low'];
    const priorityCounts = priorities.map(p => this.tickets.filter(t => ['High', 'Very High', 'Urgent'].includes(t.priority) && p === 'High' || t.priority === p).length);
    // Simplified priority mapping for the chart
    const highCount = this.tickets.filter(t => ['High', 'Very High', 'Urgent'].includes(t.priority)).length;
    const medCount = this.tickets.filter(t => t.priority === 'Medium').length;
    const lowCount = this.tickets.filter(t => ['Low', 'Very Low', 'Lowest'].includes(t.priority)).length;

    this.priorityChartData = {
        labels: ['High', 'Medium', 'Low'],
        datasets: [{
            label: 'Tickets',
            data: [highCount, medCount, lowCount],
            backgroundColor: ['#ef4444', '#f97316', '#3b82f6'],
            borderRadius: 6
        }]
    };
  }
  
  getFilteredTickets(baseList: Ticket[]) {
    let filtered = baseList;
    
    // 1. Search Filter
    const term = (this.ticketSearchTerm || '').toLowerCase().trim();
    if (term) {
        filtered = filtered.filter(t => 
            (t.title && t.title.toLowerCase().includes(term)) || 
            (t.id && t.id.toString().includes(term))
        );
    }

    // 2. Category Filter
    switch (this.activeFilter) {
      case 'My Tickets':
        return filtered.filter(t => t.assigned_to === this.currentUserId);
      case 'Unassigned':
        return filtered.filter(t => !t.assigned_to);
      case 'High Priority':
        return filtered.filter(t => ['High', 'Very High', 'Urgent'].includes(t.priority));
      case 'All':
      default:
        return filtered;
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
      this.ticketService.patchTicket(item.id, { 
          status: newStatus,
          history: historyLog
      }).subscribe({
          next: () => {
              this.messageService.add({ severity: 'info', summary: 'Status Updated', detail: `Ticket #${item.id} is now ${newStatus}` });
          },
          error: () => {
              this.messageService.add({ severity: 'error', summary: 'Update Failed', detail: 'Could not sync status change with server.' });
              this.loadTickets(); // Revert on failure
          }
      });
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
    this.router.navigate(['/home/dashboard']);
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
    this.newTicketDeadline = ticket.deadline ? new Date(ticket.deadline) : null;
    this.newTicketAssignedTo = ticket.assigned_to || null;
    this.newCommentText = '';
    this.visible = true;
  }

  canEditFull(): boolean {
    if (!this.editingTicketRef) return true; // new ticket mode (creation button already protected by *appHasPermission)
    
    // STRICT PBAC: Only users with 'ticket:edit' can modify details. 
    // Creator/Assignee exception removed for detail editing.
    return this.authService.hasPermission('ticket:edit');
  }

  canEditPartial(): boolean {
    if (!this.editingTicketRef) return false;
    // Supervisor override: can move anything
    if (this.authService.hasPermission('ticket:move')) return true;
    // Executor rule: can move if assigned to them
    return this.currentUserId === this.editingTicketRef.assigned_to;
  }

  hasTicketEditAccess(ticket: Ticket): boolean {
    // Supervisor override: can move anything
    if (this.authService.hasPermission('ticket:move')) return true;
    
    // Executor rule: can move ONLY if assigned to them
    return this.currentUserId === ticket.assigned_to;
  }

  addComment() {
    if (!this.authService.hasPermission('ticket:comment')) {
      this.messageService.add({ severity: 'error', summary: 'Prohibido', detail: 'No tienes permiso para comentar (ticket:comment).' });
      return;
    }

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
    if (this.isSaving) return;

    if (!this.newTicketTitle || !this.newTicketTitle.trim() || !this.newTicketAssignedTo || !this.newTicketDeadline) {
      this.messageService.add({severity: 'warn', summary: 'Campos Requeridos', detail: 'El Título, la Persona Asignada y la Fecha Final son obligatorios.'});
      return;
    }

    this.isSaving = true;
    
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
          payload.deadline = this.newTicketDeadline ? this.newTicketDeadline.toISOString() : undefined;
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

      this.ticketService.updateTicket(this.editingTicketId, payload).subscribe({
          next: () => {
              this.isSaving = false;
              this.messageService.add({ severity: 'success', summary: 'Updated', detail: 'Ticket updated successfully.' });
              this.loadTickets();
              this.visible = false;
          },
          error: (err) => {
              this.isSaving = false;
              this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update ticket.' });
          }
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
        deadline: this.newTicketDeadline ? this.newTicketDeadline.toISOString() : undefined,
        assigned_to: this.newTicketAssignedTo || undefined,
        created_by: this.currentUserId,
        comments: [],
        history: [{action: `Ticket created by ${this.currentUserName}`, date: today}]
      };

      this.ticketService.createTicket(newTicket).subscribe({
          next: () => {
              this.isSaving = false;
              this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Ticket created successfully.' });
              this.loadTickets();
              this.visible = false;
          },
          error: (err) => {
              this.isSaving = false;
              console.error("Failed to create ticket:", err);
              this.messageService.add({ severity: 'error', summary: 'Creation Failed', detail: (err.error?.error || err.message) });
          }
      });
    }
  }

  confirmDelete() {
    if (!this.editingTicketId) return;

    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this ticket? This action cannot be undone.',
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Yes, Delete',
      acceptButtonStyleClass: 'p-button-danger',
      rejectLabel: 'Cancel',
      accept: () => {
        this.ticketService.deleteTicket(this.editingTicketId!).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Ticket deleted successfully.' });
            this.loadTickets();
            this.visible = false;
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.error || 'Failed to delete ticket.' });
          }
        });
      }
    });
  }

  resetForm() {
    this.editingTicketId = null;
    this.editingTicketRef = null;
    this.newTicketTitle = '';
    this.newTicketDescription = '';
    this.newTicketStatus = '';
    this.newTicketPriority = '';
    this.newTicketDeadline = null;
    this.newTicketAssignedTo = null;
    this.newCommentText = '';
  }
}
