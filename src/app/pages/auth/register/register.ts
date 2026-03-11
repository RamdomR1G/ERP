import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { Header } from "../../../components/header/header";

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, ButtonModule, CardModule, InputTextModule, PasswordModule, Header],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterComponent {
  name = '';
  email = '';
  password = '';
  confirmPassword = '';

  constructor(private router: Router) {}

  onRegister() {
    this.router.navigate(['/auth/login']);
  }

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }
}