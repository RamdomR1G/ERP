import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { Header } from "../../../components/header/header";

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [ButtonModule, CardModule, TagModule, Header],
  templateUrl: './landing-page.html',
  styleUrls: ['./landing-page.css']
})
export class LandingPageComponent {
  features = [
    { title: 'User Management', description: 'Control access with roles and groups.',     icon: 'pi pi-users',         color: '#6366f1' },
    { title: 'Product Catalog', description: 'Manage inventory and product listings.',    icon: 'pi pi-box',           color: '#22c55e' },
    { title: 'Order Tracking',  description: 'Track every order from start to delivery.', icon: 'pi pi-shopping-cart', color: '#f97316' },
    { title: 'Analytics',       description: 'Get insights with real-time dashboards.',   icon: 'pi pi-chart-bar',     color: '#0ea5e9' },
  ];

  constructor(private router: Router, private authService: AuthService) {
    const user = this.authService.getCurrentUser();
    if (this.authService.getToken() && user && user.id !== '0000') {
      this.router.navigate(['/home/dashboard']);
    }
  }

  goToLogin()    { this.router.navigate(['/auth/login']); }
  goToRegister() { this.router.navigate(['/auth/register']); }
}