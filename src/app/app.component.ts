import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { distinctUntilChanged, filter } from 'rxjs/operators';

// Declare jQuery symbol
declare var $: any;
declare var gtag: Function;

// August 28, 2026 at 11:59 PM EST (UTC-4)
const COUNTDOWN_TARGET = new Date('2026-08-29T03:59:00Z');

@Component({
  standalone: false,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  constructor(private router: Router) {
    this.router.events.subscribe(event => {
      // Send page_view event to GA
      if (event instanceof NavigationEnd) {
          gtag('event', 'page_view', { 'page_path': event.urlAfterRedirects });
      }
    });
  }

  title = 'gear3';
  countdown: string = '';
  private countdownInterval: any;

  ngOnInit() {
    // Pad main Module by how big the top navbar is
    $(document).ready(this.setNavOffsets);
    $(window).resize(this.setNavOffsets);

    this.updateCountdown();
    this.countdownInterval = setInterval(() => this.updateCountdown(), 1000);
  }

  ngOnDestroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  private updateCountdown(): void {
    const now = new Date();
    const diff = COUNTDOWN_TARGET.getTime() - now.getTime();

    if (diff <= 0) {
      this.countdown = '0d 0h 0m 0s';
      clearInterval(this.countdownInterval);
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    this.countdown = `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }

  setNavOffsets() {
    // Top Navbar Offset
    let mainElem: HTMLElement = document.getElementById('mainModule');
    let topNavElem: HTMLElement = document.getElementById('topNav');
    let appBannerElem: HTMLElement = document.getElementById('appBanner');
    // mainElem.style['padding-top'] = `${topNavElem.offsetHeight + appBannerElem.offsetHeight}px`;

    // SideNavbar Offset
    // let footerElem: HTMLElement = document.getElementById('footer');
    // let sideNavElem: any = document.getElementsByTagName('ng-sidebar-container')[0];
    // sideNavElem.style['height'] = `${window.innerHeight - topNavElem.offsetHeight - footerElem.offsetHeight}px`;
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
