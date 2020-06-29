import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { SharedService } from '../../services/shared/shared.service';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'top-navbar',
  templateUrl: './top-navbar.component.html',
  styleUrls: ['./top-navbar.component.css']
})
export class TopNavbarComponent implements OnInit {

  public searchKW: string = '';

  constructor(
    private router: Router,
    private sharedService: SharedService) { }

  ngOnInit(): void {
  }

  toggleSidebar() {
    this.sharedService.toggleClick();
  }

  globalSearch(event) {
    if (event.key === "Enter" || event.type === "click") {
      // Update related apps table in detail modal with clicked investment
      $('#globalSearchTable').bootstrapTable('refreshOptions', {
        exportOptions: {
          fileName: this.sharedService.fileNameFmt('Global_Search-' + this.searchKW)
        },
        url: this.sharedService.internalURLFmt('/api/search/' + this.searchKW)
      })

      this.router.navigate([`/search`]);
    }
  }

}
