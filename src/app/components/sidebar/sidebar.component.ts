import { Component } from '@angular/core';
import { SharedService } from '@services/shared/shared.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  
  constructor(public sharedService: SharedService) {
  }

  public closeSidebar() {
    this.sharedService.toggleSidebar();
  }
}
