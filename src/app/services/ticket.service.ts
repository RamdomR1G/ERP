import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserGroup, AuthService } from './auth.service';

export interface Ticket {
  id?: string;
  group_id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assigned_to?: string;
  created_by: string;
  deadline?: string;
  comments: any[];
  history: any[];
  created_on?: string;
  assigned_user?: { name: string };
  creator?: { name: string };
}

@Injectable({ providedIn: 'root' })
export class TicketService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private apiUrl = 'http://localhost:3000/api/tickets';

  getAllTickets(): Observable<Ticket[]> {
    const user = this.auth.getCurrentUser();
    return this.http.get<Ticket[]>(`${this.apiUrl}?user_id=${user?.id}&role=${user?.role}`);
  }

  getGroupTickets(groupId: string): Observable<Ticket[]> {
    const user = this.auth.getCurrentUser();
    return this.http.get<Ticket[]>(`${this.apiUrl}?group_id=${groupId}&user_id=${user?.id}&role=${user?.role}`);
  }

  getUserTickets(userId: string): Observable<Ticket[]> {
    const user = this.auth.getCurrentUser();
    return this.http.get<Ticket[]>(`${this.apiUrl}?assigned_to=${userId}&user_id=${user?.id}&role=${user?.role}`);
  }

  createTicket(ticket: Omit<Ticket, 'id'|'created_on'>): Observable<any> {
    return this.http.post(this.apiUrl, ticket);
  }

  updateTicket(id: string, updates: Partial<Ticket>): Observable<any> {
    const user = this.auth.getCurrentUser();
    return this.http.put(`${this.apiUrl}/${id}?user_id=${user?.id}&role=${user?.role}`, updates);
  }

  deleteTicket(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
