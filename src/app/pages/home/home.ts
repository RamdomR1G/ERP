import { Component } from '@angular/core';
import { RouterOutlet } from "@angular/router";

@Component({
  selector: 'app-home',
  imports: [RouterOutlet],
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