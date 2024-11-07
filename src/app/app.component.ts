import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { SharedService } from '@services/shared/shared.service';

// Declare jQuery symbol
declare var $: any;
declare var gtag: Function;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'gear3';
  isBrowser: boolean;

  constructor(private router: Router, private sharedService: SharedService, @Inject(PLATFORM_ID) private platformId: any) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.router.events.subscribe(event => {
      // Send page_view event to GA
      if (event instanceof NavigationEnd) {
          gtag('event', 'page_view', { 'page_path': event.urlAfterRedirects });
      }
    });
  }

  ngOnInit() {
    // Pad main Module by how big the top navbar is
    if (!this.isBrowser) {
      return;
    }
    $(document).ready(this.setNavOffsets);
    $(window).resize(this.setNavOffsets);
  }

  setNavOffsets() {
    // Top Navbar Offset
    let mainElem: HTMLElement = document.getElementById('mainModule');
    let topNavElem: HTMLElement = document.getElementById('topNav');
    let appBannerElem: HTMLElement = document.getElementById('appBanner');
    mainElem.style['padding-top'] = `${topNavElem.offsetHeight + appBannerElem.offsetHeight}px`;

    // SideNavbar Offset
    let footerElem: HTMLElement = document.getElementById('footer');
    let sideNavElem: any = document.getElementsByTagName('p-sidebar')[0];
    sideNavElem.style['height'] = `${window.innerHeight - topNavElem.offsetHeight - footerElem.offsetHeight + 10}px`;
  }

  showPopup(url, title, w, h) {
     const dualScreenLeft = window.screenLeft !==  undefined ? window.screenLeft : window.screenX;
     const dualScreenTop = window.screenTop !==  undefined   ? window.screenTop  : window.screenY;
 
     const width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
     const height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;
 
     const systemZoom = width / window.screen.availWidth;
     const left = (width - w) / 2 / systemZoom + dualScreenLeft;
     const top = (height - h) / 2 / systemZoom + dualScreenTop;
     const popupWindow = window.open(url, title, 
       `
       scrollbars=yes,
       width=${w / systemZoom}, 
       height=${h / systemZoom}, 
       top=${top}, 
       left=${left}
       `
     );
 
     if (window.focus) {
      popupWindow.focus();
     } 
  }

  toggleSidebar() {
    this.sharedService.toggleSidebar();
  }

  onSidebarIconsKeyDown(e: KeyboardEvent) {
    if(e.code === 'Space' || e.code === 'Enter') {
      this.toggleSidebar();
    }
  }

}
