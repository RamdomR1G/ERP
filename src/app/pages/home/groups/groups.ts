import { Component, OnInit, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { CommonModule } from '@angular/common';
import { SelectModule } from 'primeng/select';
import { AuthService } from '../../../services/auth.service';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';

@Component({
  selector: 'app-groups',
  standalone: true,
  imports: [ButtonModule, DialogModule, InputTextModule, FormsModule, ToggleSwitchModule, CommonModule, SelectModule, HasPermissionDirective],
  templateUrl: './groups.html',
  styleUrl: './groups.css'
})

export class GroupsComponent implements OnInit {
  authService = inject(AuthService);

  visible: boolean = false;
  newGroupName: string = '';
  newGroupDescription: string = '';

  ngOnInit() {
    // Logic for loading from backend will go here...
  }

  // ── STATS ──────────────────────────────────────
  stats = [
    { label: 'Total Groups', value: 3,  icon: 'pi pi-sitemap',color: '#22c55e' },
    { label: 'Total Members', value: 6, icon: 'pi pi-users',   color: '#6366f1' },
  ];

  // ── GROUPS ─────────────────────────────────────
  groups = [
    { name: 'Management', members: 2, description: 'Executive and administrative staff', color: '#6366f1' },
    { name: 'Sales',      members: 2, description: 'Sales representatives and account managers', color: '#22c55e' },
    { name: 'Support',    members: 2, description: 'Customer support and helpdesk team', color: '#0ea5e9' },
  ];

  newGroup() {
    this.newGroupName = '';
    this.newGroupDescription = '';
    this.visible = true;
    console.log('New Group clicked');
  }
  
  saveGroup() {
    this.visible = false;
    console.log('Saved Group:', {
      name: this.newGroupName,
      description: this.newGroupDescription,
    });
  }
}
