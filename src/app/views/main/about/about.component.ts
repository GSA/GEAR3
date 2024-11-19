import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent implements OnInit {
  isBrowser: boolean;

  constructor(private route: ActivatedRoute, @Inject(PLATFORM_ID) private platformId: any) { 
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      var tab = params['tab'];

      if (!this.isBrowser) {
        return;
      }
      $('.nav-tabs a[href="#' + tab + '"]').tab('show');
    });
  }

}
