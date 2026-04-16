import { Routes } from '@angular/router';
import { LandingPageComponent } from './pages/auth/landing-page/landing-page';
import { LoginComponent } from './pages/auth/login/login';
import { RegisterComponent } from './pages/auth/register/register';
import { Skeleton } from './layouts/skeleton/skeleton';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  // Ruta por defecto → Landing
  { path: '', redirectTo: 'auth/landing-page', pathMatch: 'full' },

  // Rutas de autenticación (sin skeleton/layout)
  { path: 'auth', children: [
    { path: 'landing-page', component: LandingPageComponent },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent }
  ]},

  // Rutas protegidas (con skeleton/layout)
  { path: 'home', component: Skeleton,
    children: [
      { path: '', loadComponent: () => import('./pages/home/home').then(m => m.HomeComponent) },
      { path: 'dashboard', loadComponent: () => import('./pages/home/dashboard/dashboard').then(m => m.DashboardComponent) },
      { path: 'admin', loadComponent: () => import('./pages/home/admin/admin').then(m => m.AdminComponent) },
      
      // Rutas aseguradas con el Guard Interceptor (Security)
      { 
        path: 'users', 
        loadComponent: () => import('./pages/home/users/users').then(m => m.UsersComponent),
        canActivate: [authGuard],
        data: { requiredPermission: 'users:view' }
      },
      { 
        path: 'groups', 
        loadComponent: () => import('./pages/home/groups/groups').then(m => m.GroupsComponent),
        canActivate: [authGuard],
        data: { requiredPermission: 'group:view' }
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/home/profile/profile').then(m => m.ProfileComponent)
      },
      {
        path: 'groups/:id/dashboard',
        loadComponent: () => import('./pages/home/groups/dashboard/dashboard').then(m => m.GroupDashboardComponent),
        canActivate: [authGuard],
        data: { requiredPermission: 'group:view' }
      },
      {
        path: 'groups/:id/settings',
        loadComponent: () => import('./pages/home/groups/settings/settings').then(m => m.GroupSettingsComponent),
        canActivate: [authGuard],
        data: { requiredPermission: 'group:edit' }
      }
    ]
  },
  { path: '**', redirectTo: '' }
];