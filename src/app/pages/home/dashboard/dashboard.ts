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
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
      this.currentUser = this.authService.getCurrentUser();
      
      const ticketsReq = this.currentUser ? this.ticketService.getUserTickets(this.currentUser.id).pipe(catchError(() => of([]))) : of([]);
      const groupsReq = this.groupService.getGroups().pipe(catchError(() => of([])));

      forkJoin({
          tickets: ticketsReq,
          groups: groupsReq
      }).subscribe(res => {
          this.personalTickets = res.tickets;
          // Sort to show newest first!
          this.personalTickets.sort((a,b) => new Date(b.created_on).getTime() - new Date(a.created_on).getTime());

          // Filtering groups: If has group:view_all, show them all. Else, only show their own group.
          if (this.authService.hasPermission('group:view_all')) {
              this.groupsData = res.groups;
          } else {
              const myGroupId = this.currentUser.group_id || this.currentUser.group;
              this.groupsData = res.groups.filter(g => g.id === myGroupId);
          }

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