import { Component } from '@angular/core';

@Component({
standalone: false,
  selector: 'app-banner',
  templateUrl: './banner.component.html',
  styleUrls: ['./banner.component.css']
})
export class BannerComponent {

  public isExpanded: boolean = false;

  constructor() {
  }

  toggleBanner() {
    this.isExpanded = !this.isExpanded;
  }
}
