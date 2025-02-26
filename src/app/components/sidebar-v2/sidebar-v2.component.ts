import { Component } from '@angular/core';

@Component({
  selector: 'app-sidebar-v2',
  templateUrl: './sidebar-v2.component.html',
  styleUrls: ['./sidebar-v2.component.scss']
})
export class SidebarV2Component {

  isSidebarExpanded: boolean = false;
  
  constructor() {
  }

  public toggleSidebar(): void {
    this.isSidebarExpanded = !this.isSidebarExpanded;
  }
}