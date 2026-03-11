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
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [CommonModule, 
    FormsModule, TableModule, ButtonModule, 
    TagModule, DialogModule, InputTextModule, 
    SelectModule, CheckboxModule, HasPermissionDirective],
  templateUrl: './tickets.html',
  styleUrl: './tickets.css',
})
export class TicketsComponent implements OnInit {
  authService = inject(AuthService);
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

  ngOnInit() {
    // Server logic check goes here
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
  tickets = [
    { id: 1, title: 'Ticket 1', description: 'Description 1', status: 'Open', priority: 'High', assignedTo: 'John Doe', createdOn: '2022-01-01' },
    { id: 2, title: 'Ticket 2', description: 'Description 2', status: 'Closed', priority: 'Medium', assignedTo: 'Jane Smith', createdOn: '2022-01-02' },
    { id: 3, title: 'Ticket 3', description: 'Description 3', status: 'Open', priority: 'Low', assignedTo: 'John Doe', createdOn: '2022-01-03' },
    { id: 4, title: 'Ticket 4', description: 'Description 4', status: 'Closed', priority: 'High', assignedTo: 'Jane Smith', createdOn: '2022-01-04' },
    { id: 5, title: 'Ticket 5', description: 'Description 5', status: 'Open', priority: 'Medium', assignedTo: 'John Doe', createdOn: '2022-01-05' },
    { id: 6, title: 'Ticket 6', description: 'Description 6', status: 'Closed', priority: 'Low', assignedTo: 'Jane Smith', createdOn: '2022-01-06' },
    { id: 7, title: 'Ticket 7', description: 'Description 7', status: 'Open', priority: 'High', assignedTo: 'John Doe', createdOn: '2022-01-07' },
    { id: 8, title: 'Ticket 8', description: 'Description 8', status: 'Closed', priority: 'Medium', assignedTo: 'Jane Smith', createdOn: '2022-01-08' },
    { id: 9, title: 'Ticket 9', description: 'Description 9', status: 'Open', priority: 'Low', assignedTo: 'John Doe', createdOn: '2022-01-09' },
    { id: 10, title: 'Ticket 10', description: 'Description 10', status: 'Closed', priority: 'High', assignedTo: 'Jane Smith', createdOn: '2022-01-10' },
  ];

  getTicketSeverity(status: string): 'success' | 'warn' | 'danger' | 'info' {
    switch (status) {
      case 'Open': return 'info';
      case 'In Progress': return 'warn';
      case 'Closed': return 'success';
      default: return 'info';
    }
  }

  // ── STATS ──────────────────────────────────────
  stats = [
    { label: 'Total Tickets', value: 10, icon: 'pi pi-ticket', color: '#6366f1' },
    { label: 'Open', value: 5, icon: 'pi pi-check', color: '#0ea5e9' },
    { label: 'Closed', value: 5, icon: 'pi pi-times', color: '#f97316' },
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