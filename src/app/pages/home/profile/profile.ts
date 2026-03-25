import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule, TagModule, TableModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class ProfileComponent implements OnInit {

  user = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'Developer',
    group: 'Engineering',
    joined: '2023-01-15',
    avatar: 'https://primefaces.org/cdn/primeng/images/avatar/amyelsner.png'
  };

  assignedTickets: any[] = [];
  
  stats = {
    open: 0,
    inProgress: 0,
    done: 0
  };

  ngOnInit() {
    this.loadAssignedTickets();
    this.calculateStats();
  }

  loadAssignedTickets() {
    // Mock user workload
    this.assignedTickets = [
      { id: 1, title: 'Database Migration', project: 'Backend Services', status: 'Pending', priority: '高', deadline: '2023-10-10' },
      { id: 3, title: 'UI Update', project: 'Frontend App', status: 'Done', priority: '低', deadline: '2023-10-05' },
      { id: 5, title: 'Write tests', project: 'Backend Services', status: 'Pending', priority: '中', deadline: '2023-10-12' },
      { id: 8, title: 'Fix Auth bug', project: 'Security Team', status: 'In Progress', priority: '紧急', deadline: '2023-10-08' },
    ];
  }

  calculateStats() {
    this.stats.open = this.assignedTickets.filter(t => t.status === 'Pending').length;
    this.stats.inProgress = this.assignedTickets.filter(t => t.status === 'In Progress').length;
    this.stats.done = this.assignedTickets.filter(t => t.status === 'Done').length;
  }

  getTicketSeverity(priority: string): 'success' | 'warn' | 'danger' | 'info' {
    switch (priority) {
      case '最低':
      case '极低':
      case '低': return 'success';
      case '中': return 'info';
      case '高':
      case '极高': return 'warn';
      case '紧急': return 'danger';
      default: return 'info';
    }
  }

}
