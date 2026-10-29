import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Data, Params, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
    selector: 'it-bricks',
    templateUrl: './it-bricks.component.html',
    styleUrls: ['./it-bricks.component.scss'],
    standalone: false
})
export class ItBricksComponent implements OnInit, OnDestroy {

  @ViewChild('bricksFrame') public bricksFrame: ElementRef<HTMLIFrameElement>;

  public safeUrl: SafeResourceUrl;
  public pageTitle: string = 'IT Bricks';

  /** Blueprint index restored from the URL on load, applied once the iframe reports ready. */
  private pendingBp: number | null = null;
  /** Executive tier restored from the URL on load, applied once the iframe reports ready. */
  private pendingTier: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sanitizer: DomSanitizer
  ) { }

  public ngOnInit(): void {
    this.route.data.subscribe((data: Data) => {
      const src: string = data['bricksSrc'];
      this.pageTitle = data['title'] || this.pageTitle;
      this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(src);
    });

    this.route.queryParams.subscribe((params: Params) => {
      const bp = params['bp'];
      const tier = params['tier'];
      this.pendingBp = bp !== undefined && bp !== null && bp !== '' ? parseInt(bp, 10) : null;
      this.pendingTier = tier !== undefined && tier !== null && tier !== '' ? parseInt(tier, 10) : null;
    });
  }

  public ngOnDestroy(): void { /* listener removed automatically via decorator */ }

  /** Receives blueprint/tier selection messages from the embedded IT Bricks report. */
  @HostListener('window:message', ['$event'])
  public onIframeMessage(event: MessageEvent): void {
    const data = event && event.data;
    if (!data || typeof data.type !== 'string') { return; }

    if (data.type === 'it-bricks:blueprint') {
      const bp = typeof data.bp === 'number' && !isNaN(data.bp) ? data.bp : null;
      this.updateQueryParam({ bp: bp === null ? null : bp });
    } else if (data.type === 'it-bricks:tier') {
      const tier = typeof data.tier === 'number' && !isNaN(data.tier) ? data.tier : null;
      this.updateQueryParam({ tier: tier === null ? null : tier });
    }
  }

  /** Once the iframe has loaded, push any selection restored from the URL back into it. */
  public onFrameLoad(): void {
    const win = this.bricksFrame && this.bricksFrame.nativeElement
      ? this.bricksFrame.nativeElement.contentWindow
      : null;
    if (!win) { return; }

    if (this.pendingBp !== null) {
      win.postMessage({ type: 'it-bricks:set-blueprint', bp: this.pendingBp }, '*');
    }
    if (this.pendingTier !== null) {
      win.postMessage({ type: 'it-bricks:set-tier', tier: this.pendingTier }, '*');
    }
  }

  private updateQueryParam(params: Params): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }
}
