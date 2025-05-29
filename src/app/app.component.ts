import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { distinctUntilChanged, filter } from 'rxjs/operators';

// Declare jQuery symbol
declare var $: any;
declare var gtag: Function;

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    standalone: false
})
export class AppComponent implements OnInit {
  constructor(private router: Router) {
    this.router.events.subscribe(event => {
      // Send page_view event to GA
      if (event instanceof NavigationEnd) {
          gtag('event', 'page_view', { 'page_path': event.urlAfterRedirects });
      }
    });
  }

  title = 'gear3';

  ngOnInit() {
    // Pad main Module by how big the top navbar is
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
    let sideNavElem: any = document.getElementsByTagName('ng-sidebar-container')[0];
    sideNavElem.style['height'] = `${window.innerHeight - topNavElem.offsetHeight - footerElem.offsetHeight}px`;
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

}
