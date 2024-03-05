import { AfterViewInit, Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

import { environment } from '@environments/environment';

import { ApiService } from '@services/apis/api.service';
import { SharedService } from '@services/shared/shared.service';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'top-navbar',
  templateUrl: './top-navbar.component.html',
  styleUrls: ['./top-navbar.component.css'],
})
export class TopNavbarComponent implements AfterViewInit {
  public envName: string = '';
  public searchKW: string = '';

  showNavContent = true;
  @ViewChild('moreLinksBtn') moreLinksBtn: ElementRef;

  moreLinksVisibleStatus = false;

  constructor(
    private apiService: ApiService,
    private router: Router,
    public sharedService: SharedService
  ) {
    if (environment.name !== 'Production') {
      this.envName = `<span> - ${environment.name.toUpperCase()} ENVIRONMENT</span>`;
    }
  }

  ngAfterViewInit(): void {
    this.moreLinksVisibleStatus = this.isMoreLinksVisible();
    this.showNavContent = !this.moreLinksVisibleStatus
  }

  @HostListener('window:resize')
  ngDoCheck() {
    if (!this.isMoreLinksVisible() && !this.showNavContent) {
      this.showNavContent = true;
    }
    if (!this.moreLinksVisibleStatus && this.isMoreLinksVisible()) {
      this.showNavContent = false;
      $('#topNavToggle').removeClass('opposite');
    }
    this.moreLinksVisibleStatus = this.isMoreLinksVisible();
  }

  globalSearch(event) {
    if (event.key === 'Enter' || event.type === 'click') {
      $('#globalSearchTable').bootstrapTable('refreshOptions', {
        exportOptions: {
          fileName: this.sharedService.fileNameFmt(
            'GEAR_Global_Search-' + this.searchKW
          ),
        },
        url: this.apiService.globalSearchUrl + this.searchKW,
      });

      this.router.navigate([`/search`]);
    }
  }

  // Toggle arrow rotation when top navbar collapse button is clicked
  toggleTopNavBttn() {
    $('#topNavToggle').toggleClass('opposite');
    this.showNavContent = !this.showNavContent;
  }

  isMoreLinksVisible() {
    return this.moreLinksBtn && this.moreLinksBtn.nativeElement && this.moreLinksBtn.nativeElement.offsetParent;
  }

  processTopNavLink() {
    if (!this.isMoreLinksVisible()) {
      this.showNavContent = true;
      return;
    }
    this.toggleTopNavBttn();
  }
}
