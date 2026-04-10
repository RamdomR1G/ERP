import { Component } from '@angular/core';
import { Header } from '../../components/header/header';
import { Sidebar } from '../../components/sidebar/sidebar';
import { MainContainer } from '../../components/main-container/main-container';
import { Footer } from '../../components/footer/footer';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [Header, Sidebar, MainContainer, Footer, ToastModule],
  templateUrl: './skeleton.html',
  styleUrl: './skeleton.css'
})
export class Skeleton {
  sidebarCollapsed = false;

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }
}