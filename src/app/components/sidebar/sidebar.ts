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
    { label: 'Tickets', icon: 'pi pi-ticket', route: '/home/tickets', requiredPermission: 'ticket:view', requiresGroup: false },
    { label: 'Users', icon: 'pi pi-user', route: '/home/users', requiredPermission: 'users:view', requiresGroup: false },
    { label: 'Groups', icon: 'pi pi-users', route: '/home/groups', requiredPermission: 'group:view', requiresGroup: false },
  ];

  canShowMenuItem(item: any): boolean {
    const hasGroup = !!this.authService.getActiveGroup();
    
    // Si el ítem requiere un grupo activo y no hay uno, lo ocultamos
    if (item.requiresGroup && !hasGroup) {
        return false;
    }

    if (!item.requiredPermission) return true; // public
    return this.authService.hasPermission(item.requiredPermission, true);
  }

  navigate(route: string) {
    this.router.navigate([route], { queryParamsHandling: 'preserve' });
  }
}