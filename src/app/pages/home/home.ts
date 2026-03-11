import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent {
  title = 'WELCOME TO HELL M*F**!';

  constructor() {
    // You can add any initialization logic here if needed
  }

  ngOnInit() {
    console.log(this.title);
  }
}