import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { Header } from "../../../components/header/header";
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, IftaLabelModule, InputTextModule, CardModule, PasswordModule, ButtonModule, Header],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  email = '';
  password = '';
  emailValid = true;

  validateEmail() {
    this.emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email);
  }

  isFormValid(): boolean {
    return this.email.length > 0 && this.password.length > 0 && this.emailValid;
  }

  onLogin() {
    // ── SIMULADOR DE "TOKEN DE PERMISOS" DEL BACKEND (JWT) ──
    
    // 1. Check if user exists in our central mock database
    const dbUsers = this.authService.getUsers();
    const matchedUser = dbUsers.find(u => u.email.toLowerCase() === this.email.toLowerCase());

    if (matchedUser) {
      console.log(`Login: Found User (${matchedUser.name}) in DB. Loading their toggled permissions.`);
      this.authService.setCurrentUser({ email: matchedUser.email, name: matchedUser.name });
      this.authService.setPermissions(matchedUser.permissions || []);
    } else {
      // 2. Fallback for unrecognized emails during dev testing
      console.log(`Login: Unrecognized User (${this.email}). Receiving default fallback token.`);
      let userName = this.email.split('@')[0];
      const strippedName = userName.toLowerCase().replace(/[^a-z]/g, '');
      if (strippedName === 'johndoe') {
        userName = 'John Doe';
      } else if (strippedName === 'janesmith') {
        userName = 'Jane Smith';
      } else {
        userName = userName.charAt(0).toUpperCase() + userName.slice(1);
      }
      this.authService.setCurrentUser({ email: this.email, name: userName });
      this.authService.setPermissions([
        'group:view', 
        'ticket:view', 
        'ticket:edit_state', 
        'user:view', 
        'user:edit'
      ]);
    }

    // ── SIMULADOR DE "GRUPOS DISPONIBLES" ──
    // Simularemos que todos los usuarios pertenecen a 3 centros de trabajo / grupos
    this.authService.setGroups([
      { id: 'g01', name: 'Equipo Dev', icon: 'pi pi-code' },
      { id: 'g02', name: 'Soporte', icon: 'pi pi-headphones' },
      { id: 'g03', name: 'UX & Design', icon: 'pi pi-palette' }
    ]);

    this.router.navigate(['/home/dashboard']);
  }

  goToRegister() {
    this.router.navigate(['/auth/register']);
  }

  constructor(private router: Router, private authService: AuthService) {}
}