import { Component } from '@angular/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TabsModule } from 'primeng/tabs';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [TableModule, ButtonModule, TagModule, TabsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class AdminComponent {

  // ── STATS ──────────────────────────────────────
  stats = [
    { label: 'Total Users',  value: 6,  icon: 'pi pi-users',  color: '#6366f1' },
    { label: 'Total Groups', value: 3,  icon: 'pi pi-sitemap',color: '#22c55e' },
    { label: 'Active',       value: 4,  icon: 'pi pi-check',  color: '#0ea5e9' },
    { label: 'Inactive',     value: 2,  icon: 'pi pi-times',  color: '#f97316' },
  ];

  // ── USERS ──────────────────────────────────────
  users = [
    { name: 'Alice Johnson', email: 'alice@erp.com', role: 'Admin',   group: 'Management', status: 'Active',   joined: 'Jan 2024' },
    { name: 'Bob Smith',     email: 'bob@erp.com',   role: 'User',    group: 'Sales',      status: 'Active',   joined: 'Mar 2024' },
    { name: 'Carol White',   email: 'carol@erp.com', role: 'User',    group: 'Sales',      status: 'Inactive', joined: 'Feb 2024' },
    { name: 'David Lee',     email: 'david@erp.com', role: 'Manager', group: 'Management', status: 'Active',   joined: 'Apr 2024' },
    { name: 'Eva Brown',     email: 'eva@erp.com',   role: 'User',    group: 'Support',    status: 'Active',   joined: 'Jun 2024' },
    { name: 'Frank Miller',  email: 'frank@erp.com', role: 'Manager', group: 'Support',    status: 'Inactive', joined: 'Aug 2024' },
  ];

  // ── GROUPS ─────────────────────────────────────
  groups = [
    { name: 'Management', members: 2, description: 'Executive and administrative staff', color: '#6366f1' },
    { name: 'Sales',      members: 2, description: 'Sales representatives and account managers', color: '#22c55e' },
    { name: 'Support',    members: 2, description: 'Customer support and helpdesk team', color: '#0ea5e9' },
  ];

  getUserSeverity(status: string): 'success' | 'danger' {
    return status === 'Active' ? 'success' : 'danger';
  }

  newUser() {
    console.log('New User clicked');
  }

  newGroup() {
    console.log('New Group clicked');
  }
}