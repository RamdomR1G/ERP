import { Component, Input, OnInit, inject, computed } from '@angular/core';
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
    { label: 'Admin', icon: 'pi pi-cog', route: '/home/admin', requiredPermission: 'ADMIN_CHECK', requiresGroup: false },
    { label: 'Profile', icon: 'pi pi-user', route: '/home/profile', requiredPermission: null, requiresGroup: false },
  ];

  // SIGNAL REACTIVO PARA EL MENÚ
  visibleMenuItems = computed(() => {
    // Escuchamos los cambios en el grupo activo de forma reactiva
    const group = this.authService.activeGroupSignal();
    const hasGroup = !!group;

    return this.menuItems.filter(item => {
        // 1. Verificar si requiere grupo
        if (item.requiresGroup && !hasGroup) return false;

        // 2. Verificar permisos
        if (!item.requiredPermission) return true;

        if (item.requiredPermission === 'ADMIN_CHECK') {
            return this.authService.hasPermission('users:manage', true) || 
                   this.authService.hasPermission('groups:manage', true) ||
                   this.authService.hasPermission('*', true);
        }

        return this.authService.hasPermission(item.requiredPermission, true);
    });
  });


  onLogout() {
    if (confirm('Are you sure you want to sign out?')) {
        this.authService.logout();
    }
  }

  navigate(route: string) {
    this.router.navigate([route], { queryParamsHandling: 'preserve' });
  }
}