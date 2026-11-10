import { AfterViewInit, Component, ElementRef, OnDestroy, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-banner',
    templateUrl: './banner.component.html',
    styleUrls: ['./banner.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class BannerComponent implements AfterViewInit, OnDestroy {

  public isBannerExpanded: boolean = false;

  private resizeObserver?: ResizeObserver;

  constructor(private elementRef: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    // Keep --gear-banner-height in sync with the banner's rendered height so the
    // fixed top navbar always sits flush beneath it, even when the banner
    // expands or the viewport changes.
    this.resizeObserver = new ResizeObserver(() => this.updateBannerHeight());
    this.resizeObserver.observe(this.elementRef.nativeElement);
    this.updateBannerHeight();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  public toggleBanner(): void {
    this.isBannerExpanded = !this.isBannerExpanded;
  }

  private updateBannerHeight(): void {
    const height = this.elementRef.nativeElement.offsetHeight;
    const root = document.documentElement;
    root.style.setProperty('--gear-banner-height', `${height}px`);

    // Keep the combined header offset in sync when the banner expands/collapses
    // (the top navbar's own observer only fires when the navbar itself resizes).
    const topbar = document.querySelector('app-topbar') as HTMLElement | null;
    const topbarHeight = topbar ? topbar.offsetHeight : 0;
    root.style.setProperty('--gear-header-offset', `${height + topbarHeight}px`);
  }
}
