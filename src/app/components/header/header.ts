import { Component, EventEmitter, Output, Input, OnInit, inject } from '@angular/core';
import { MenuModule } from 'primeng/menu';
import { MenuItem, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [ButtonModule, MenuModule],
  providers: [MessageService],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {
  @Output() toggleSidebar = new EventEmitter<void>();
  @Input() isLandingPage: boolean = false;

  router = inject(Router);
  authService = inject(AuthService);

  private messageService = inject(MessageService);
  items: MenuItem[] | undefined;
  userNameContext: string = 'Profile';

  ngOnInit(): void {
    const user: any = this.authService.getCurrentUser();
    this.userNameContext = user && user.name ? user.name : 'Unknown User';

    this.items = [
      {
        label: 'Documents',
        items: [
          {
            label: 'Contracts',
            icon: 'pi pi-file'
          },
          {
            label: 'New',
            icon: 'pi pi-file-plus'
          },
        ]
      }, 
      {
        label: this.userNameContext,
        items: [
          {
            label: 'My Profile',
            icon: 'pi pi-user',
            command: () => { this.navigate('/home/profile'); }
          },
          {
            label: 'Settings',
            icon: 'pi pi-cog'
          },
          {
            label: 'Logout',
            icon: 'pi pi-sign-out',
            command: () => {
                sessionStorage.clear();
                this.navigate('/auth/login'); 
            }
          }
        ]
      }
    ]
  }

  navigate(route: string) {
    this.router.navigate([route]);
  }

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }

  goToRegister() {
    this.router.navigate(['/auth/register']);
  }
}