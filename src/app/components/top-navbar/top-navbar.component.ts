import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { environment } from '@environments/environment';

import { ApiService } from '@services/apis/api.service';
import { SharedService } from '@services/shared/shared.service';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'top-navbar',
  templateUrl: './top-navbar.component.html',
  styleUrls: ['./top-navbar.component.css']
})
export class TopNavbarComponent implements OnInit {

  public envName: string = '';
  public searchKW: string = '';

  constructor(
    private apiService: ApiService,
    private router: Router,
    public sharedService: SharedService) {
      if (environment.name !== 'Production') {
        this.envName = `<span class="text-danger"> - ${environment.name.toUpperCase()} ENVIRONMENT</span>`;
      };
    }

  ngOnInit(): void {
  }

  globalSearch(event) {
    if (event.key === "Enter" || event.type === "click") {
      // Update related apps table in detail modal with clicked investment
      $('#globalSearchTable').bootstrapTable('refreshOptions', {
        exportOptions: {
          fileName: this.sharedService.fileNameFmt('GEAR_Global_Search-' + this.searchKW)
        },
        url: this.apiService.globalSearchUrl + this.searchKW
      })

      this.router.navigate([`/search`]);
    }
  }

  // Toggle arrow rotation when top navbar collapse button is clicked
  toggleTopNavBttn() {
    $("#topNavToggle").toggleClass("opposite");
  }

}
