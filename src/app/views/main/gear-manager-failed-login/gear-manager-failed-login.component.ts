import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'gear-manager-failed-login',
    templateUrl: './gear-manager-failed-login.component.html',
    styleUrls: ['./gear-manager-failed-login.component.scss'],
    standalone: false
})
export class GearManagerFailedLoginComponent implements OnInit {

  constructor(private router: Router) { }

  ngOnInit(): void {
  }

  public retryLogin(): void {
    this.router.navigate(['/gear-manager']);
  }

  public goHome(): void {
    this.router.navigate(['/']);
  }

}