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
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [TableModule, TagModule, CommonModule, ButtonModule, CardModule, TooltipModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
  currentUser: any;
  groupsData: UserGroup[] = [];
  personalTickets: any[] = [];
  stats: any[] = [];

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
          this.cdr.detectChanges();
      });
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