import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { AuthService } from '../../../services/auth.service';
import { TicketService } from '../../../services/ticket.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule, TagModule, TableModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class ProfileComponent implements OnInit {

  authService = inject(AuthService);
  ticketService = inject(TicketService);

  user: any = {
    name: 'Loading...',
    email: '...',
    role: '...',
    group: '...',
    joined: '...',
    avatar: 'https://primefaces.org/cdn/primeng/images/avatar/amyelsner.png'
  };

  assignedTickets: any[] = [];
  
  stats = {
    open: 0,
    inProgress: 0,
    done: 0
  };

  ngOnInit() {
    const currentUser: any = this.authService.getCurrentUser();
    if (currentUser) {
      this.user = {
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role || 'Member',
        group: currentUser.group_id || 'Unassigned',
        joined: currentUser.created_on ? currentUser.created_on.slice(0, 10) : '2023-01-01',
        avatar: 'https://primefaces.org/cdn/primeng/images/avatar/amyelsner.png'
      };

      if (currentUser.id) {
         this.loadAssignedTickets(currentUser.id);
      }
    }
  }

  loadAssignedTickets(userId: string) {
    this.ticketService.getUserTickets(userId).subscribe({
      next: (tickets) => {
        this.assignedTickets = tickets;
        this.calculateStats();
      },
      error: (err) => console.error("Error loading tickets", err)
    });
  }

  calculateStats() {
    this.stats.open = this.assignedTickets.filter(t => t.status === 'Pending').length;
    this.stats.inProgress = this.assignedTickets.filter(t => t.status === 'In Progress').length;
    this.stats.done = this.assignedTickets.filter(t => t.status === 'Done').length;
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

}
