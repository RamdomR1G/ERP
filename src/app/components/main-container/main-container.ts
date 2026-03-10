import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-main-container',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './main-container.html',
  styleUrl: './main-container.css'
})
export class MainContainer {}