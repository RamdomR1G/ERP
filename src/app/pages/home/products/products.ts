import { Component } from '@angular/core';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [TagModule],
  templateUrl: './products.html',
  styleUrl: './products.css'
})
export class ProductsComponent {
  products = [
    { name: 'Laptop Pro 15"',  category: 'Electronics', price: '$1,299', stock: 45,  status: 'In Stock',     image: 'pi pi-desktop'   },
    { name: 'Wireless Mouse',  category: 'Accessories', price: '$45',    stock: 120, status: 'In Stock',     image: 'pi pi-send'      },
    { name: 'Keyboard RGB',    category: 'Accessories', price: '$89',    stock: 0,   status: 'Out of Stock', image: 'pi pi-tablet'    },
    { name: 'Monitor 4K 27"',  category: 'Electronics', price: '$650',   stock: 15,  status: 'In Stock',     image: 'pi pi-desktop'   },
    { name: 'USB-C Hub',       category: 'Accessories', price: '$30',    stock: 5,   status: 'Low Stock',    image: 'pi pi-server'    },
    { name: 'Webcam HD',       category: 'Electronics', price: '$120',   stock: 30,  status: 'In Stock',     image: 'pi pi-video'     },
    { name: 'Headphones Pro',  category: 'Audio',       price: '$250',   stock: 0,   status: 'Out of Stock', image: 'pi pi-headphones'},
    { name: 'Desk Lamp LED',   category: 'Office',      price: '$55',    stock: 80,  status: 'In Stock',     image: 'pi pi-sun'       },
  ];

  getSeverity(status: string): 'success' | 'warn' | 'danger' {
    if (status === 'In Stock')  return 'success';
    if (status === 'Low Stock') return 'warn';
    return 'danger';
  }
}