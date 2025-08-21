import { Component, OnInit } from '@angular/core';
import { SharedService } from '../../../services/shared/shared.service';
import { Router } from '@angular/router';

@Component({
  selector: 'gear-manager',
  templateUrl: './gear-manager.component.html',
  styleUrls: ['./gear-manager.component.css']
})
export class GearManagerComponent implements OnInit {
  isAuthenticated: boolean = false;
  hasAccess: boolean = false;
  isLoading: boolean = true;
  errorMessage: string = '';
  showError: boolean = false;

  constructor(
    private sharedService: SharedService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.checkAuthenticationStatus();
  }

  checkAuthenticationStatus(): void {
    this.isLoading = true;
    this.showError = false;
    
    setTimeout(() => {
      this.sharedService.verifyCookies();
      
      setTimeout(() => {
        this.isAuthenticated = this.sharedService.loggedIn;
        
        if (this.isAuthenticated) {
          this.hasAccess = true;
          this.errorMessage = '';
          this.showError = false;
        } else {
          this.hasAccess = false;
          this.showError = true;
          this.errorMessage = 'You do not have the appropriate role in GEAR to access GEAR Manager. If you have a business need to edit/add data to the IT Standards list, please request access to GEAR Manager.';
        }
        
        this.isLoading = false;
      }, 1000);
    }, 500);
  }

  onAccessGearManager(): void {
    if (!this.isAuthenticated) {
      window.location.href = '/beginAuth';
    }
  }

  retryAuthentication(): void {
    this.checkAuthenticationStatus();
  }

  requestAccess(): void {
    window.open('https://docs.google.com/forms/d/e/1FAIpQLSdmvOEESbKRJ5z4GnOw9hMqWIAI8m5H8I0-tB4zU3mc3aeYPA/viewform?usp=sf_link', '_blank');
  }
}