import { Component, OnInit, inject } from '@angular/core';
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
import { ActivatedRoute, Router } from '@angular/router';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { AuthService } from '../../../../services/auth.service';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';

@Component({
  selector: 'app-group-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, CardModule, TagModule, DialogModule, InputTextModule, SelectModule, DragDropModule, TableModule, SelectButtonModule, IconFieldModule, InputIconModule, HasPermissionDirective],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class GroupDashboardComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  groupId: string | null = null;
  groupName: string = 'Loading...';

  viewMode: string = 'kanban';
  viewOptions = [
    { icon: 'pi pi-server', value: 'kanban' },
    { icon: 'pi pi-list', value: 'list' }
  ];

  // Modal logic for Add Ticket
  visible: boolean = false;
  newTicketTitle: string = '';
  newTicketDescription: string = '';
  newTicketStatus: string = '';
  newTicketPriority: string = '';
  newTicketAssignedTo: string = '';

  statuses: {name: string}[] = [
    { name: 'Pending' },
    { name: 'In Progress' },
    { name: 'Review' },
    { name: 'Done' }
  ];

  priorities = [
    { name: 'Lowest' },   // 最低
    { name: 'Very Low' }, // 极低
    { name: 'Low' },      // 低
    { name: 'Medium' },   // 中
    { name: 'High' },     // 高
    { name: 'Very High' },// 极高
    { name: 'Urgent' }    // 紧急
  ];

  get currentUser(): string {
    const user = this.authService.getCurrentUser();
    return user ? user.name : 'Unknown User';
  }

  activeFilter: string = 'All';
  filters = ['All', 'My Tickets', 'Unassigned', 'High Priority'];

  tickets: any[] = [
    { id: 1, title: 'Database Migration', description: 'Migrate users to new db', status: 'Pending', priority: 'High', assignedTo: 'John Doe', createdBy: 'Admin', createdOn: '2023-10-01', deadline: '2023-10-10', comments: [{author: 'Admin', text: 'Please start this ASAP.', date: '2023-10-01'}], history: [{action: 'Ticket created', date: '2023-10-01'}] },
    { id: 2, title: 'API Integration', description: 'Integrate billing API', status: 'In Progress', priority: 'Very High', assignedTo: 'Jane Smith', createdBy: 'John Doe', createdOn: '2023-10-02', deadline: '2023-10-15', comments: [], history: [{action: 'Ticket created', date: '2023-10-02'}] },
    { id: 3, title: 'UI Update', description: 'Update navbar color', status: 'Done', priority: 'Low', assignedTo: 'John Doe', createdBy: 'Jane Smith', createdOn: '2023-10-03', deadline: '2023-10-05', comments: [], history: [{action: 'Ticket created', date: '2023-10-03'}, {action: 'Status changed to Done', date: '2023-10-04'}] },
    { id: 4, title: 'Code Review', description: 'Review authentication PRs', status: 'Review', priority: 'Urgent', assignedTo: 'Jane Smith', createdBy: 'Admin', createdOn: '2023-10-04', deadline: '2023-10-06', comments: [], history: [{action: 'Ticket created', date: '2023-10-04'}] },
    { id: 5, title: 'Write tests', description: 'Add unit tests for auth', status: 'Pending', priority: 'Medium', assignedTo: 'John Doe', createdBy: 'Admin', createdOn: '2023-10-05', deadline: '2023-10-12', comments: [], history: [{action: 'Ticket created', date: '2023-10-05'}] },
  ];
  
  // Edited Ticket logic
  editingTicketId: number | null = null;
  newCommentText: string = '';
  editingTicketRef: any = null;

  ngOnInit() {
    this.groupId = this.route.snapshot.paramMap.get('id');
    if (this.groupId) {
      // In a real app we would load group data by ID here
      this.groupName = this.groupId.charAt(0).toUpperCase() + this.groupId.slice(1);
    }
  }
  
  getFilteredTickets(baseList: any[]) {
    switch (this.activeFilter) {
      case 'My Tickets':
        return baseList.filter(t => t.assignedTo === this.currentUser);
      case 'Unassigned':
        return baseList.filter(t => !t.assignedTo || t.assignedTo.trim() === '' || t.assignedTo === 'Unassigned');
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
  
  // For the List View
  get filteredTicketsList() {
    return this.getFilteredTickets(this.tickets);
  }

  // Drag and drop handler
  drop(event: CdkDragDrop<any[]>, newStatus: string) {
    if (event.previousContainer === event.container) {
      // Move within the same column (just reordering local array if needed)
      // Since arrays are filtered getters, we'd need a real data structure for reordering.
      // For now, if we just want it to drop in place, we can ignore reordering.
    } else {
      // Move to a different column
      const item = event.previousContainer.data[event.previousIndex];

      // Strictly deny status changes via drag-and-drop if the user doesn't have edit access
      if (!this.hasTicketEditAccess(item)) {
        return;
      }

      // Update status in the main array
      const ticketToUpdate = this.tickets.find(t => t.id === item.id);
      if (ticketToUpdate) {
        const oldStatus = ticketToUpdate.status;
        ticketToUpdate.status = newStatus;
        ticketToUpdate.history.push({
          action: `Status changed from ${oldStatus} to ${newStatus}`,
          date: new Date().toISOString().split('T')[0]
        });
        // Re-assigning to trigger Angular change detection if necessary
        this.tickets = [...this.tickets];
      }
    }
  }

  get recentTickets() {
    // Return last 3 for mini-list
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

  editTicket(ticket: any) {
    this.editingTicketId = ticket.id;
    this.editingTicketRef = ticket;
    this.newTicketTitle = ticket.title;
    this.newTicketDescription = ticket.description;
    this.newTicketStatus = ticket.status;
    this.newTicketPriority = ticket.priority;
    this.newTicketAssignedTo = ticket.assignedTo;
    this.newCommentText = '';
    this.visible = true;
  }

  canEditFull(): boolean {
    if (!this.editingTicketRef) return true; // new ticket mode
    if (this.authService.hasPermission('ticket:edit')) return true; // admins can do everything
    return this.currentUser === this.editingTicketRef.createdBy;
  }

  canEditPartial(): boolean {
    if (!this.editingTicketRef) return false;
    if (this.authService.hasPermission('ticket:edit')) return true;
    return this.currentUser === this.editingTicketRef.assignedTo;
  }

  hasTicketEditAccess(ticket: any): boolean {
    if (this.authService.hasPermission('ticket:edit')) return true;
    return this.currentUser === ticket.assignedTo;
  }

  addComment() {
    if (this.newCommentText.trim() && this.editingTicketRef) {
      const today = new Date().toISOString().split('T')[0];
      this.editingTicketRef.comments.push({
        author: this.currentUser,
        text: this.newCommentText,
        date: today
      });
      this.editingTicketRef.history.push({
        action: `Comment added by ${this.currentUser}`,
        date: today
      });
      this.newCommentText = '';
    }
  }

  saveTicket() {
    const today = new Date().toISOString().split('T')[0];
    if (this.editingTicketId) {
      // Update existing ticket
      const idx = this.tickets.findIndex(t => t.id === this.editingTicketId);
      if (idx !== -1) {
        const oldTicket = this.tickets[idx];
        const updatedTicket = {
          ...oldTicket,
          status: this.newTicketStatus || 'Pending',
        };

        // Only full editors can update title, description, priority, assignee
        if (this.canEditFull()) {
          updatedTicket.title = this.newTicketTitle;
          updatedTicket.description = this.newTicketDescription;
          updatedTicket.priority = this.newTicketPriority || 'Medium';
          updatedTicket.assignedTo = this.newTicketAssignedTo;
        }

        if (oldTicket.status !== updatedTicket.status) {
           updatedTicket.history.push({ action: `Status changed to ${updatedTicket.status}`, date: today });
        }
        
        // Push general edit history if changes were made by creator
        if (this.canEditFull() && (oldTicket.title !== updatedTicket.title || oldTicket.description !== updatedTicket.description)) {
           updatedTicket.history.push({ action: `Ticket details updated`, date: today });
        }

        this.tickets[idx] = updatedTicket;
      }
    } else {
      // Create new ticket
      const newId = this.tickets.length > 0 ? Math.max(...this.tickets.map(t => t.id)) + 1 : 1;
      const newTicket = {
        id: newId,
        title: this.newTicketTitle.trim(),
        description: this.newTicketDescription,
        status: this.newTicketStatus || 'Pending',
        priority: this.newTicketPriority || 'Medium',
        assignedTo: this.newTicketAssignedTo,
        createdBy: this.currentUser,
        createdOn: today,
        deadline: '',
        comments: [],
        history: [{action: `Ticket created by ${this.currentUser}`, date: today}]
      };
      // Insert into array
      this.tickets.push(newTicket);
      // Immediately transition to the detailed view of the newly created ticket
      this.editTicket(newTicket);
      return; 
    }
    this.visible = false;
    this.resetForm();
  }

  resetForm() {
    this.editingTicketId = null;
    this.editingTicketRef = null;
    this.newTicketTitle = '';
    this.newTicketDescription = '';
    this.newTicketStatus = '';
    this.newTicketPriority = '';
    this.newTicketAssignedTo = '';
    this.newCommentText = '';
  }
}
