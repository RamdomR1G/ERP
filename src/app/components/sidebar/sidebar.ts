import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar implements OnInit {
  @Input() collapsed = false;

  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);

  constructor(private router: Router) {}

  ngOnInit() {
    // La lógica de permisos ahora es manejada exclusivamente por el AuthService y el backend.
  }

  menuItems = [
    { label: 'Dashboard', icon: 'pi pi-home', route: '/home/dashboard', requiredPermission: null, requiresGroup: false },
    { label: 'Tickets', icon: 'pi pi-ticket', route: '/home/tickets', requiredPermission: 'tickets:view', requiresGroup: false },
    { label: 'Admin', icon: 'pi pi-cog', route: '/home/admin', requiredPermission: 'ADMIN_CHECK', requiresGroup: false },
    { label: 'Profile', icon: 'pi pi-user', route: '/home/profile', requiredPermission: null, requiresGroup: false },
  ];

  canShowMenuItem(item: any): boolean {
    const hasGroup = !!this.authService.getActiveGroup();
    
    // Si el ítem requiere un grupo activo y no hay uno, lo ocultamos
    if (item.requiresGroup && !hasGroup) {
        return false;
    }

    if (!item.requiredPermission) return true; // public
    
    // Check especial para Admin (necesita users:manage O groups:manage o ser Admin real)
    if (item.requiredPermission === 'ADMIN_CHECK') {
        return this.authService.hasPermission('users:manage', true) || 
               this.authService.hasPermission('groups:manage', true) ||
               this.authService.hasPermission('*', true);
    }

    return this.authService.hasPermission(item.requiredPermission, true);
  }

  onLogout() {
    if (confirm('Are you sure you want to sign out?')) {
        this.authService.logout();
    }
  }

  navigate(route: string) {
    this.router.navigate([route], { queryParamsHandling: 'preserve' });
  }
}