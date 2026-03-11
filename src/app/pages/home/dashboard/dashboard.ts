import { Component } from '@angular/core';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [TableModule, TagModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent {

  // ── TOTAL N CARDS ──────────────────────────────
  stats = [
    { label: 'Total Users',    value: 1240, icon: 'pi pi-users',         color: '#6366f1' },
    { label: 'Total Products', value: 340,  icon: 'pi pi-box',           color: '#22c55e' },
    { label: 'Orders Today',   value: 87,   icon: 'pi pi-shopping-cart', color: '#f97316' },
    { label: 'Revenue',        value: '$12,430', icon: 'pi pi-dollar',   color: '#0ea5e9' },
  ];

  // ── ADVANCE CARDS ──────────────────────────────
  advances = [
    { title: 'Monthly Growth', description: 'Sales increased by 18% compared to last month.', icon: 'pi pi-arrow-up', color: '#22c55e' },
    { title: 'Pending Orders', description: '23 orders are awaiting approval or shipment.',   icon: 'pi pi-clock',    color: '#f97316' },
    { title: 'New Users',      description: '57 new users registered in the last 7 days.',    icon: 'pi pi-user-plus',color: '#6366f1' },
  ];

  // ── RECENT ORDERS TABLE ────────────────────────
  recentOrders = [
    { id: '#001', customer: 'Alice Johnson',  product: 'Laptop Pro',    status: 'Delivered', amount: '$1,200' },
    { id: '#002', customer: 'Bob Smith',      product: 'Wireless Mouse',status: 'Pending',   amount: '$45'    },
    { id: '#003', customer: 'Carol White',    product: 'Keyboard RGB',  status: 'Shipped',   amount: '$89'    },
    { id: '#004', customer: 'David Lee',      product: 'Monitor 4K',    status: 'Delivered', amount: '$650'   },
    { id: '#005', customer: 'Eva Brown',      product: 'USB Hub',       status: 'Cancelled', amount: '$30'    },
  ];

  getSeverity(status: string): 'success' | 'warn' | 'info' | 'danger' | 'secondary' {
  const map: Record<string, 'success' | 'warn' | 'info' | 'danger' | 'secondary'> = {
    Delivered: 'success',
    Pending: 'warn',
    Shipped: 'info',
    Cancelled: 'danger'
  };
  return map[status] ?? 'secondary';
}
}