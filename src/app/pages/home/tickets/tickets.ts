import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { TicketService } from '../../../services/ticket.service';
import { GroupService } from '../../../services/group.service';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [CommonModule, 
    FormsModule, TableModule, ButtonModule, 
    TagModule, DialogModule, InputTextModule, 
    SelectModule, CheckboxModule, TooltipModule, DividerModule],
  templateUrl: './tickets.html',
  styleUrl: './tickets.css',
})
export class TicketsComponent implements OnInit {
  authService = inject(AuthService);
  ticketService = inject(TicketService);
  groupService = inject(GroupService);
  cdr = inject(ChangeDetectorRef);
  private http = inject(HttpClient);
  
  // ── DROPDOWN OPTIONS ───────────────────────────
  statuses = [
    { name: 'Open' },
    { name: 'In Progress' },
    { name: 'Closed' }
  ];

  priorities = [
    { name: 'Low' },
    { name: 'Medium' },
    { name: 'High' },
    { name: 'Urgent' }
  ];

  currentUser: any;
  viewFilter: 'All' | 'Group' | 'Mine' = 'All';
  selectedGroup: any = null;
  filteredTickets: any[] = [];
  groupsList: any[] = []; // Stores the dropdown groups array

  // ── VIEW TICKET ────────────────────────────────
  viewDialogVisible: boolean = false;
  selectedTicket: any = null;

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.loadData();
  }

  loadData() {
    if (!this.currentUser) return;

    let ticketsReq: Observable<any[]>;
    if (this.authService.hasPermission('ticket:view')) {
        ticketsReq = this.ticketService.getAllTickets();
    } else {
        ticketsReq = this.ticketService.getUserTickets(this.currentUser.id);
        this.viewFilter = 'Mine';
    }

    forkJoin({
      tickets: ticketsReq,
      groups: this.groupService.getGroups().pipe(catchError(() => of([])))
    }).subscribe({
        next: (res) => {
            this.tickets = res.tickets;
            this.groupsList = res.groups;
            this.applyFilter();
        },
        error: (err) => console.error('Failed to load data', err)
    });
  }

  applyFilter() {
      if (!this.currentUser) return;
      
      if (this.viewFilter === 'Mine') {
          this.filteredTickets = this.tickets.filter(t => t.assigned_to === this.currentUser.id);
      } else if (this.viewFilter === 'Group' && this.selectedGroup) {
          // Compare with selected dropdown group ID
          this.filteredTickets = this.tickets.filter(t => t.group_id === this.selectedGroup);
      } else if (this.viewFilter === 'Group' && !this.selectedGroup) {
          this.filteredTickets = []; // Wait for selection
      } else {
          this.filteredTickets = this.tickets;
      }
      this.updateStats();
      this.cdr.detectChanges();
  }

  setFilter(filter: 'All' | 'Group' | 'Mine') {
      if (!this.authService.hasPermission('ticket:view') && filter !== 'Mine') return; 
      this.viewFilter = filter;
      this.applyFilter();
  }

  onGroupSelect(event: any) {
      if (event.value) {
          this.viewFilter = 'Group';
          this.selectedGroup = event.value;
          this.applyFilter();
      }
  }

  openTicketDetails(ticket: any) {
      this.selectedTicket = ticket;
      // Resolve beautiful group name if possible
      const targetGroup = this.groupsList.find(g => g.id === ticket.group_id);
      if (targetGroup) {
         this.selectedTicket.safeGroupText = targetGroup.name;
      }
      this.viewDialogVisible = true;
  }

  updateStats() {
    const total = this.filteredTickets.length;
    const open = this.filteredTickets.filter(t => t.status === 'Pending' || t.status === 'Open').length;
    const closed = this.filteredTickets.filter(t => t.status === 'Done' || t.status === 'Closed').length;

    this.stats = [
        { label: 'Total Tickets', value: total, icon: 'pi pi-ticket', color: '#6366f1' },
        { label: 'Active', value: open, icon: 'pi pi-check', color: '#0ea5e9' },
        { label: 'Closed', value: closed, icon: 'pi pi-times', color: '#f97316' },
      ];
  }

  // ── ROLES ──────────────────────────────────────
  roles = [
    { name: 'Admin', description: 'Full access to all features', color: '#6366f1' },
    { name: 'User',  description: 'Limited access to features', color: '#22c55e' },
    { name: 'Guest', description: 'Read-only access', color: '#0ea5e9' },
  ];

  // ── GROUPS ──────────────────────────────────────
  groups = [
    { name: 'Management', members: 2, description: 'Executive and administrative staff', color: '#6366f1' },
    { name: 'Sales',      members: 2, description: 'Sales representatives and account managers', color: '#22c55e' },
    { name: 'Support',    members: 2, description: 'Customer support and helpdesk team', color: '#0ea5e9' },
  ];

  // ── TICKETS ──────────────────────────────────────
  tickets: any[] = [];

  getTicketSeverity(status: string): 'success' | 'warn' | 'danger' | 'info' {
    switch (status) {
      case 'Pending': 
      case 'Open': return 'info';
      case 'In Progress': return 'warn';
      case 'Done': 
      case 'Closed': return 'success';
      default: return 'info';
    }
  }

  // ── STATS ──────────────────────────────────────
  stats = [
    { label: 'Total Tickets', value: 0, icon: 'pi pi-ticket', color: '#6366f1' },
    { label: 'Active', value: 0, icon: 'pi pi-check', color: '#0ea5e9' },
    { label: 'Closed', value: 0, icon: 'pi pi-times', color: '#f97316' },
  ];

  // ── NEW TICKET ─────────────────────────────────
  visible: boolean = false;
  newTicketTitle: string = '';
  newTicketDescription: string = '';
  newTicketStatus: string = '';
  newTicketPriority: string = '';
  newTicketAssignedTo: string = '';

  newTicket() {
    this.visible = true;
    console.log('New Ticket clicked');
  }

  saveTicket() {
    this.visible = false;
    console.log('Saved Ticket:', {
      title: this.newTicketTitle,
      description: this.newTicketDescription,
      status: this.newTicketStatus,
      priority: this.newTicketPriority,
      assignedTo: this.newTicketAssignedTo
    });
  }

  resetForm() {
    this.newTicketTitle = '';
    this.newTicketDescription = '';
    this.newTicketStatus = '';
    this.newTicketPriority = '';
    this.newTicketAssignedTo = '';
  }
}