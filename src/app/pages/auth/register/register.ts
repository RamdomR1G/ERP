import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Header } from "../../../components/header/header";
import { AuthService, AppUser } from '../../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, ButtonModule, CardModule, InputTextModule, PasswordModule, ToastModule, Header],
  providers: [MessageService],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterComponent {
  name = '';
  email = '';
  password = '';
  confirmPassword = '';

  constructor(private router: Router, private authService: AuthService, private messageService: MessageService) {}

  onRegister() {
    if (!this.name || !this.email || !this.password) {
        this.messageService.add({severity: 'warn', summary: 'Mising Info', detail: 'Please fill in all fields.'});
        return;
    }
    if (this.password !== this.confirmPassword) {
        this.messageService.add({severity: 'error', summary: 'Mismatch', detail: 'Passwords do not match.'});
        return;
    }

    this.authService.register(this.name, this.email, this.password).subscribe({
      next: () => {
         this.messageService.add({severity: 'success', summary: 'Welcome!', detail: 'Account created successfully! Redirecting...'});
         setTimeout(() => {
           this.router.navigate(['/auth/login']);
         }, 1500);
      },
      error: (err) => {
         const msg = err.error?.error || 'Failed to create account. Check your connection.';
         this.messageService.add({severity: 'error', summary: 'Registration Error', detail: msg});
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }
}