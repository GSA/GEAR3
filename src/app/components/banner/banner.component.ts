import { AfterViewInit, Component, ElementRef, Renderer2, ViewChild } from '@angular/core';

// import * as banner from 'node_modules/@uswds/uswds/packages/usa-banner/src/index.js';

@Component({
    selector: 'app-banner',
    templateUrl: './banner.component.html',
    styleUrls: ['./banner.component.css'],
    standalone: false
})
export class BannerComponent implements AfterViewInit {

  @ViewChild('bannerPanel') bannerPanelRef: ElementRef;
  @ViewChild('bannerExpandButton') bannerButtonRef: ElementRef;

  constructor(private renderer: Renderer2) {

    this.renderer.listen('window', 'click', (e: Event) => {
      // hide banner for outside mouse click
      if (!this.bannerPanelRef.nativeElement.contains(e.target)) {
        this.collpseBanner();
      }
    });
  }

  isBannerExpanded() {
    return this.bannerButtonRef.nativeElement.getAttribute("aria-expanded") == 'true';
  }

  initBanner() {
    // banner.init(this.bannerPanelRef);
  }

  collpseBanner() {

    if (this.isBannerExpanded()) {
      // Reinitialize banner
      this.initBanner();
    }
  }

  ngAfterViewInit(): void {
    this.initBanner();
  }
}
