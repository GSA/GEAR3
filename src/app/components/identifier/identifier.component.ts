import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-identifier',
    templateUrl: './identifier.component.html',
    styleUrls: ['./identifier.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class IdentifierComponent {
currentYear: number = new Date().getFullYear();
  constructor() {
  }
}
