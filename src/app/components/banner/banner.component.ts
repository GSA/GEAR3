import { isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Inject, PLATFORM_ID, Renderer2, ViewChild } from '@angular/core';

const EXPANDED = "aria-expanded";
const CONTROLS = "aria-controls";
const HIDDEN = "hidden";

@Component({
  selector: 'app-banner',
  templateUrl: './banner.component.html',
  styleUrls: ['./banner.component.css']
})
export class BannerComponent implements AfterViewInit {
  isBrowser: boolean;

  @ViewChild('bannerPanel') bannerPanelRef: ElementRef;
  @ViewChild('bannerExpandButton') bannerButtonRef: ElementRef;

  constructor(private renderer: Renderer2, @Inject(PLATFORM_ID) private platformId: any) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (!this.isBrowser) {
      return;
    }
    this.renderer.listen('window', 'click', (e: Event) => {
      if (!this.bannerPanelRef.nativeElement.contains(e.target)) {
        this.collpseBanner();
      }
    });
  }

  toggle(button, expanded) {
    let safeExpanded = expanded;

    if (typeof safeExpanded !== "boolean") {
      safeExpanded = button.getAttribute(EXPANDED) === "false";
    }

    const id = button.getAttribute(CONTROLS);
    const controls = document.getElementById(id);
    if (!controls) {
      throw new Error(`No toggle target found with id: "${id}"`);
    }

    if (safeExpanded) {
      controls.removeAttribute(HIDDEN);
    } else {
      controls.setAttribute(HIDDEN, "");
    }

    return safeExpanded;
  }

  isBannerExpanded() {
    return this.bannerButtonRef.nativeElement.getAttribute(EXPANDED) == 'true';
  }

  collpseBanner() {
    if (this.isBannerExpanded()) {
      this.bannerButtonRef.nativeElement.setAttribute(EXPANDED, false);
      const id = this.bannerButtonRef.nativeElement.getAttribute(CONTROLS);
      const controls = document.getElementById(id);
      controls.setAttribute(HIDDEN, "");
    }
  }

  ngAfterViewInit(): void {
    this.collpseBanner();
  }
}
