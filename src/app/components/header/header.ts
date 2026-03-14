import { Component, EventEmitter, Output, Input, OnInit, inject } from '@angular/core';
import { MenuModule } from 'primeng/menu';
import { MenuItem, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';

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

  private messageService = inject(MessageService);
  items: MenuItem[] | undefined;

  ngOnInit(): void {
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
        label: 'Profile',
        items: [
          {
            label: 'Perfil',
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
            command: () => { this.navigate('/auth/login'); }
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