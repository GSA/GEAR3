import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, HostListener, Renderer2, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

import { environment } from '@environments/environment';
import { AnalyticsService } from '@services/analytics/analytics.service';
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

  // is more links button visible
  moreLinksVisibleStatus = false;
  //can show nav menu items.
  showNavContent = false;

  @ViewChild('moreLinksBtn') moreLinksBtnRef: ElementRef;
  @ViewChild('navPanel') navPanelRef: ElementRef;

  constructor(
    private router: Router,
    public sharedService: SharedService,
    private renderer: Renderer2,
    private changeDetectorRef: ChangeDetectorRef,
    private analyticsService: AnalyticsService
  ) {
    if (environment.name !== 'Production') {
      this.envName = `<span> - ${environment.name.toUpperCase()} ENVIRONMENT</span>`;
    }

    this.renderer.listen('window', 'click', (e: Event) => { // hide top nav for outside mouse click
      if (this.showNavContent && !this.navPanelRef.nativeElement.contains(e.target) && !this.moreLinksBtnRef.nativeElement.contains(e.target)) {
        this.collpseTopNav();
      }
    });
  }


  ngAfterViewInit(): void {
    this.moreLinksVisibleStatus = this.isMoreLinksVisible();
    this.showNavContent = !this.moreLinksVisibleStatus;
    this.changeDetectorRef.detectChanges();
  }

  expandTopNav() {
    this.showNavContent = true;
    $('#topNavToggle').addClass('opposite');
  }

  collpseTopNav() {
    this.showNavContent = false;
    $('#topNavToggle').removeClass('opposite');
  }

  @HostListener('window:resize')
  ngDoCheck() {
    if (!this.isMoreLinksVisible() && !this.showNavContent) {
      this.expandTopNav();
    }
    if (!this.moreLinksVisibleStatus && this.isMoreLinksVisible()) {
      this.collpseTopNav();
    }
    this.moreLinksVisibleStatus = this.isMoreLinksVisible();
  }

  globalSearch(event) {
    if (event.key === 'Enter' || event.type === 'click') {
      this.router.navigate([`/search/${this.searchKW}`]);
    }
  }

  // Toggle arrow rotation when top navbar collapse button is clicked
  toggleTopNavBttn() {
    $('#topNavToggle').toggleClass('opposite');
    this.showNavContent = !this.showNavContent;
  }

  isMoreLinksVisible() {
    return this.moreLinksBtnRef && this.moreLinksBtnRef.nativeElement && this.moreLinksBtnRef.nativeElement.offsetParent;
  }

  processTopNavLink() {
    if (!this.isMoreLinksVisible()) {
      this.collpseTopNav();
      return;
    }
    this.toggleTopNavBttn();
  }

  /* Stop the dropdown from closing when a header is clicked
  *  which can lead to confusion on what is clickable or not
  */
  onDropdownHeaderClick(e: Event): void {
    e.stopPropagation();
  }

  public onLinkClick(event: PointerEvent, route: string) {
    let keyboardEvent: boolean = false;

    // Check if the click event keyboard enter
    if(event.clientX === 0) {
      keyboardEvent = true;
    }

    this.analyticsService.logTopbarNavEvent(route, keyboardEvent);

    this.processTopNavLink();
  }

  public onLinkKeyboardDown(event: KeyboardEvent, route: string, changeRoute: boolean = true) {
    if(event.code === 'Space') {
      this.analyticsService.logTopbarNavEvent(route, true);

      if(changeRoute) {
        // Also navigate since space doesn't trigger routerLink
        this.router.navigate([route]);
      }

      this.processTopNavLink();
    }
  }

  public onAboutClick(event: Event): void {
    event.preventDefault();
    // Open About modal instead of navigating to About page
    const aboutModal = document.getElementById('aboutModal');
    if (aboutModal) {
      // Using Bootstrap modal API
      const modal = new (window as any).bootstrap.Modal(aboutModal);
      modal.show();
    }
    this.processTopNavLink();
  }
}