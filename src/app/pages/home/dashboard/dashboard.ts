import { Component, ChangeDetectorRef, OnInit, inject } from '@angular/core';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { AuthService, UserGroup } from '../../../services/auth.service';
import { GroupService } from '../../../services/group.service';
import { TicketService } from '../../../services/ticket.service';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TooltipModule } from 'primeng/tooltip';
import { ChartModule } from 'primeng/chart';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [TableModule, TagModule, CommonModule, ButtonModule, CardModule, TooltipModule, ChartModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
  currentUser: any;
  groupsData: UserGroup[] = [];
  personalTickets: any[] = [];
  stats: any[] = [];

  // ── CHARTS ──────────────────────────────────────
  statusChartData: any;
  statusChartOptions: any;
  priorityChartData: any;
  priorityChartOptions: any;

  constructor(
    public authService: AuthService, 
    private groupService: GroupService, 
    private ticketService: TicketService,
    private router: Router, 
    private cdr: ChangeDetectorRef,
    private http: HttpClient
  ) {}

  ngOnInit() {
      const storedUser = this.authService.getCurrentUser();
      if (!storedUser) return;

      // Fetch fresh user data to ensure group_permissions and context are up to date
      const userRefreshReq = this.http.get<any>(`http://localhost:3000/api/users/${storedUser.id}`).pipe(catchError(() => of(storedUser)));
      const ticketsReq = this.ticketService.getUserTickets(storedUser.id).pipe(catchError(() => of([])));
      const groupsReq = this.groupService.getGroups().pipe(catchError(() => of([])));

      forkJoin({
          user: userRefreshReq,
          tickets: ticketsReq,
          groups: groupsReq
      }).subscribe(res => {
          this.currentUser = res.user;
          this.authService.setCurrentUser(res.user); // Sync back to service
          
          this.personalTickets = res.tickets;
          this.personalTickets.sort((a,b) => new Date(b.created_on).getTime() - new Date(a.created_on).getTime());

          // The groups come pre-filtered from the server according to user isolation rules
          this.groupsData = res.groups; 

          this.calculateStats();
          this.initCharts();
          this.cdr.detectChanges();
      });
  }

  initCharts() {
      const documentStyle = getComputedStyle(document.documentElement);
      const textColor = documentStyle.getPropertyValue('--text-color');

      // Status Chart Options
      this.statusChartOptions = {
          plugins: {
              legend: { labels: { usePointStyle: true, color: textColor } }
          },
          responsive: true,
          maintainAspectRatio: false
      };

      // Priority Chart Options
      this.priorityChartOptions = {
          maintainAspectRatio: false,
          aspectRatio: 0.8,
          plugins: {
              legend: { labels: { color: textColor } }
          },
          scales: {
              x: {
                  grid: { color: 'rgba(255,255,255,0.1)', drawBorder: false },
                  ticks: { color: textColor }
              },
              y: {
                  grid: { color: 'rgba(255,255,255,0.1)', drawBorder: false },
                  ticks: { color: textColor }
              }
          }
      };
  }

  calculateStats() {
      const activeTickets = this.personalTickets.filter(t => t.status !== 'Done' && t.status !== 'Closed');
      const pendingCnt = activeTickets.filter(t => t.status === 'Pending').length;
      const inProgCnt = activeTickets.filter(t => t.status === 'In Progress').length;
      
      this.stats = [
        { label: 'Assigned active', value: activeTickets.length, icon: 'pi pi-ticket', color: '#6366f1' },
        { label: 'Pending', value: pendingCnt, icon: 'pi pi-clock', color: '#f97316' },
        { label: 'In Progress', value: inProgCnt, icon: 'pi pi-spinner', color: '#22c55e' },
      ];

      // Prepare Chart Data
      const statuses = ['Pending', 'In Progress', 'Done', 'Review', 'Closed'];
      const statusCounts = statuses.map(s => this.personalTickets.filter(t => t.status === s).length);

      this.statusChartData = {
          labels: statuses,
          datasets: [{
              data: statusCounts,
              backgroundColor: ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#64748b'],
              hoverBackgroundColor: ['#fb923c', '#60a5fa', '#4ade80', '#c084fc', '#94a3b8']
          }]
      };

      const priorities = ['High', 'Medium', 'Low'];
      const priorityCounts = priorities.map(p => this.personalTickets.filter(t => t.priority === p).length);

      this.priorityChartData = {
          labels: priorities,
          datasets: [{
              label: 'Tickets by Priority',
              data: priorityCounts,
              backgroundColor: ['#ef4444', '#f97316', '#3b82f6'],
              borderRadius: 8
          }]
      };
  }

  getSeverity(status: string): 'success' | 'warn' | 'info' | 'danger' | 'secondary' {
    const map: Record<string, 'success' | 'warn' | 'info' | 'danger' | 'secondary'> = {
      Done: 'success',
      Closed: 'success',
      Pending: 'warn',
      Review: 'info',
      'In Progress': 'info'
    };
    return map[status] ?? 'secondary';
  }

  jumpToTicket(ticket: any) {
      if (!ticket.group_id) return;
      this.authService.setActiveGroup({ id: ticket.group_id } as any);
      // Navigate to the dashboard; unfortunately not deeply linking to ticket modal, but brings them to group workspace
      this.router.navigate(['/home/groups', ticket.group_id, 'dashboard']);
  }

  // ── SELECTION LOGIC ────────────────────────

  selectGroup(group: UserGroup) {
    this.authService.setActiveGroup(group);
    if (group) {
      this.router.navigate(['/home/groups', group.id, 'dashboard']);
    }
  }
}