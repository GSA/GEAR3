import { AfterViewInit, Component, ElementRef, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { SharedService } from '@services/shared/shared.service';
import { environment } from '@environments/environment';
import { AnalyticsService } from '@services/analytics/analytics.service';

@Component({
    selector: 'app-topbar',
    templateUrl: './topbar.component.html',
    styleUrls: ['./topbar.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class TopbarComponent implements AfterViewInit, OnDestroy {

  public envName: string = '';
  public searchKW: string = '';

  private resizeObserver?: ResizeObserver;

  constructor(
    private router: Router,
    private sharedService: SharedService,
    private analyticsService: AnalyticsService,
    private elementRef: ElementRef<HTMLElement>
  ) {
    this.envName = environment.name;
  }

  ngAfterViewInit(): void {
    // Publish the combined height of the fixed banner + top navbar as
    // --gear-header-offset so other sticky elements (sidebar, report table
    // headers) can pin just below the fixed header.
    this.resizeObserver = new ResizeObserver(() => this.updateHeaderOffset());
    this.resizeObserver.observe(this.elementRef.nativeElement);
    this.updateHeaderOffset();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  private updateHeaderOffset(): void {
    const styles = getComputedStyle(document.documentElement);
    const bannerHeight = parseFloat(styles.getPropertyValue('--gear-banner-height')) || 0;
    const topbarHeight = this.elementRef.nativeElement.offsetHeight;
    document.documentElement.style.setProperty('--gear-header-offset', `${bannerHeight + topbarHeight}px`);
  }

  public globalSearch(event) {
    if (event.key === 'Enter' || event.type === 'click') {
      this.analyticsService.logSearchEvent(this.searchKW);
      this.router.navigate(['/search', this.searchKW]);
    }
  }

  public onAboutClick(): void {
    this.analyticsService.logClickEvent('/about');
    this.router.navigate(['/about']);
  }

  public isProd(): boolean {
    return environment.name === 'Production';
  }

  public isLoggedIn(): boolean {
    return this.sharedService.loggedIn;
  }

  public openFeedbackSurvey(): void {
    const url = 'https://feedback.gsa.gov/jfe/form/SV_1FHaqcMEjIa9hPM';
    const width = 800;
    const height = 700;
    const left = Math.round(window.screenX + (window.outerWidth - width) / 2);
    const top = Math.round(window.screenY + (window.outerHeight - height) / 2);
    window.open(url, 'FeedbackSurvey', `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`);
  }

}