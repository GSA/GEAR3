import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Data } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
    selector: 'it-bricks',
    templateUrl: './it-bricks.component.html',
    styleUrls: ['./it-bricks.component.scss'],
    standalone: false
})
export class ItBricksComponent implements OnInit {

  public safeUrl: SafeResourceUrl;
  public pageTitle: string = 'IT Bricks';

  constructor(
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer
  ) { }

  public ngOnInit(): void {
    this.route.data.subscribe((data: Data) => {
      const src: string = data['bricksSrc'];
      this.pageTitle = data['title'] || this.pageTitle;
      this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(src);
    });
  }
}
