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
    this.route.queryParams.subscribe(params => {
      // ── PERMITIR PROBAR PERMISOS DESDE LA URL (EJ: ?permissions=ticket:view,group:add) ──
      if (params['permissions']) {
        const permsArray = params['permissions'].split(',');
        this.authService.setPermissions(permsArray);
      }
    });
  }

  menuItems = [
    //{ label: 'Home', icon: 'pi pi-home', route: '/home', requiredPermission: null },
    { label: 'Dashboard', icon: 'pi pi-home', route: '/home/dashboard', requiredPermission: null },
    //{ label: 'Products', icon: 'pi pi-box', route: '/home/products', requiredPermission: null },
    { label: 'Tickets', icon: 'pi pi-ticket', route: '/home/tickets', requiredPermission: 'ticket:view' },
    { label: 'Users', icon: 'pi pi-user', route: '/home/users', requiredPermission: 'users:view' },
    { label: 'Groups', icon: 'pi pi-users', route: '/home/groups', requiredPermission: 'group:view' },
    //{ label: 'Reports', icon: 'pi pi-chart-bar', route: '/home/reports', requiredPermission: null } // assuming public
  ];

  canShowMenuItem(item: any): boolean {
    if (!item.requiredPermission) return true; // public
    return this.authService.hasPermission(item.requiredPermission);
  }

  navigate(route: string) {
    this.router.navigate([route], { queryParamsHandling: 'preserve' });
  }
}