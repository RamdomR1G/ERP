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
  allTickets: any[] = []; // Global dataset for executive view
  stats: any[] = [];

  // ── CHARTS ──────────────────────────────────────
  statusChartData: any;
  statusChartOptions: any;
  priorityChartData: any;
  priorityChartOptions: any;
  groupChartData: any;

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
      const personalTicketsReq = this.ticketService.getUserTickets(storedUser.id).pipe(catchError(() => of([])));
      const allTicketsReq = this.ticketService.getAllTickets().pipe(catchError(() => of([])));
      const groupsReq = this.groupService.getGroups().pipe(catchError(() => of([])));

      forkJoin({
          user: userRefreshReq,
          personal: personalTicketsReq,
          all: allTicketsReq,
          groups: groupsReq
      }).subscribe(res => {
          this.currentUser = res.user;
          this.authService.setCurrentUser(res.user); 
          
          this.personalTickets = res.personal;
          this.allTickets = res.all;
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
      // 1. Overview Cards (Global Context)
      const globalActive = this.allTickets.filter(t => t.status !== 'Done' && t.status !== 'Closed');
      const pendingCnt = globalActive.filter(t => t.status === 'Pending').length;
      const myAssigned = this.personalTickets.filter(t => t.status !== 'Done' && t.status !== 'Closed').length;
      
      this.stats = [
        { label: 'Total Global Active', value: globalActive.length, icon: 'pi pi-globe', color: '#6366f1' },
        { label: 'Unchecked Pending', value: pendingCnt, icon: 'pi pi-clock', color: '#f97316' },
        { label: 'My Personal Work', value: myAssigned, icon: 'pi pi-user', color: '#22c55e' },
      ];

      // 2. Status Distribution (Global)
      const statuses = ['Pending', 'In Progress', 'Done', 'Review', 'Closed'];
      const statusCounts = statuses.map(s => this.allTickets.filter(t => t.status === s).length);

      this.statusChartData = {
          labels: statuses,
          datasets: [{
              data: statusCounts,
              backgroundColor: ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#64748b'],
              hoverBackgroundColor: ['#fb923c', '#60a5fa', '#4ade80', '#c084fc', '#94a3b8']
          }]
      };

      // 3. Priority Overview (Global)
      const priorities = ['High', 'Medium', 'Low'];
      const priorityCounts = priorities.map(p => this.allTickets.filter(t => t.priority === p).length);

      this.priorityChartData = {
          labels: priorities,
          datasets: [{
              label: 'Global Priority Load',
              data: priorityCounts,
              backgroundColor: ['#ef4444', '#f97316', '#3b82f6'],
              borderRadius: 8
          }]
      };

      // 4. Tickets per Group (Workspace Distribution)
      const groupStats = this.groupsData.map(group => {
          return {
              name: group.name,
              count: this.allTickets.filter(t => t.group_id === group.id).length
          };
      });

      this.groupChartData = {
          labels: groupStats.map(g => g.name),
          datasets: [{
              data: groupStats.map(g => g.count),
              backgroundColor: ['#6366f1', '#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
              hoverBackgroundColor: ['#818cf8', '#c084fc', '#60a5fa', '#34d399', '#fbbf24', '#f87171']
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