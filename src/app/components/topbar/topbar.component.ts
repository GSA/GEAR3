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
    this.router.navigate(['/about']);
  }

  public isProd(): boolean {
    return environment.name === 'Production';
  }

  public isLoggedIn(): boolean {
    return this.sharedService.loggedIn;
  }

}