import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent implements OnInit, OnDestroy {

  private tab: number;
  private sub: any;

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.sub = this.route.params.subscribe(params => {
      this.tab = params['tab'];

      $('.nav-tabs a[href="' + this.tab + '"]').tab('show');
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

}
