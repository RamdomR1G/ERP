import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Header } from "../../../components/header/header";
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, IftaLabelModule, InputTextModule, CardModule, PasswordModule, ButtonModule, ToastModule, Header],
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
    if (!this.email || !this.password) {
        this.messageService.add({severity: 'warn', summary: 'Campos vacíos', detail: 'Por favor llena correo y contraseña.'});
        return;
    }

    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        // ── SIMULADOR DE "GRUPOS DISPONIBLES" ──
        this.authService.setGroups([
          { id: 'g01', name: 'Equipo Dev', icon: 'pi pi-code' },
          { id: 'g02', name: 'Soporte', icon: 'pi pi-headphones' }
        ]);
        
        this.messageService.add({severity: 'success', summary: 'Bienvenido', detail: 'Inicio de sesión exitoso.'});
        this.router.navigate(['/home/dashboard']);
      },
      error: (err) => {
        console.error('Login Error:', err);
        const msg = err.error?.error || 'No se pudo contactar al servidor';
        this.messageService.add({severity: 'error', summary: 'Acceso Denegado', detail: msg});
      }
    });
  }

  goToRegister() {
    this.router.navigate(['/auth/register']);
  }

  constructor(private router: Router, private authService: AuthService, private messageService: MessageService) {}
}