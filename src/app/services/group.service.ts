import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserGroup } from './auth.service';

@Injectable({ providedIn: 'root' })
export class GroupService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/groups';

  getGroups(): Observable<UserGroup[]> {
    return this.http.get<UserGroup[]>(this.apiUrl);
  }

  createGroup(group: Partial<UserGroup>): Observable<any> {
    return this.http.post(this.apiUrl, group);
  }

  getGroupById(id: string): Observable<UserGroup> {
    return this.http.get<UserGroup>(`${this.apiUrl}/${id}`);
  }

  updateGroup(id: string, group: Partial<UserGroup>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, group);
  }

  deleteGroup(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
