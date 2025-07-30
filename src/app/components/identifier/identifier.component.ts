import { Component } from '@angular/core';

@Component({
  selector: 'app-identifier',
  templateUrl: './identifier.component.html',
  styleUrls: ['./identifier.component.css']
})
export class IdentifierComponent {
currentYear: number = new Date().getFullYear();
  constructor() {
  }
}
