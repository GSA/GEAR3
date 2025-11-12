import { AfterViewInit, Component, ElementRef, Renderer2, ViewChild } from '@angular/core';

@Component({
    selector: 'app-banner',
    templateUrl: './banner.component.html',
    styleUrls: ['./banner.component.scss'],
    standalone: false
})
export class BannerComponent {

  public isBannerExpanded: boolean = false;

  constructor() {}

  public toggleBanner(): void {
    this.isBannerExpanded = !this.isBannerExpanded;
  }
}
