import { Routes } from '@angular/router';
import { LandingPageComponent } from './pages/auth/landing-page/landing-page';
import { LoginComponent } from './pages/auth/login/login';
import { RegisterComponent } from './pages/auth/register/register';
import { Skeleton } from './layouts/skeleton/skeleton';

export const routes: Routes = [
  { path: '', redirectTo: 'auth/landing-page', pathMatch: 'full' },
  { path: 'auth', children: [
    { path: 'landing-page', component: LandingPageComponent },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent }
  ]},
  { path: 'home', component: Skeleton,
    children: [
      { path: '', loadComponent: () => import('./pages/home/home').then(m => m.HomeComponent) },
      { path: 'dashboard', loadComponent: () => import('./pages/home/dashboard/dashboard').then(m => m.DashboardComponent) },
      { path: 'products', loadComponent: () => import('./pages/home/products/products').then(m => m.ProductsComponent) },
      { path: 'users', loadComponent: () => import('./pages/home/users/users').then(m => m.UsersComponent) },
      { path: 'groups', loadComponent: () => import('./pages/home/groups/groups').then(m => m.GroupsComponent) },
      { path: 'tickets', loadComponent: () => import('./pages/home/tickets/tickets').then(m => m.TicketsComponent) }
    ]
  }
];