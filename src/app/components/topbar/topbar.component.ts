import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { SharedService } from '@services/shared/shared.service';
import { environment } from '@environments/environment';

@Component({
    selector: 'app-topbar',
    templateUrl: './topbar.component.html',
    styleUrls: ['./topbar.component.scss'],
    standalone: false
})
export class TopbarComponent {

  public envName: string = '';
  public searchKW: string = '';
  
  constructor(
    private router: Router,
    private sharedService: SharedService
  ) {
    this.envName = environment.name;
  }

  public globalSearch(event) {
    if (event.key === 'Enter' || event.type === 'click') {
      this.router.navigate([`/search/${this.searchKW}`]);
    }
  }

  public onAboutClick(): void {
    // Open About modal instead of navigating to About page
    const aboutModal = document.getElementById('aboutModal');
    if (aboutModal) {
      // Using Bootstrap modal API
      const modal = new (window as any).bootstrap.Modal(aboutModal);
      modal.show();
    }
  }

  public isProd(): boolean {
    return environment.name === 'Production';
  }

  public isLoggedIn(): boolean {
    return this.sharedService.loggedIn;
  }

}