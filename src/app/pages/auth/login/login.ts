import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { Header } from "../../../components/header/header";

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
    this.router.navigate(['/home']);
    console.log('Login:', this.email);
  }

  goToRegister() {
    this.router.navigate(['/auth/register']);
  }

  constructor(private router: Router) {}
}