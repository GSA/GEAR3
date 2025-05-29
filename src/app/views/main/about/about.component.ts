import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

// Declare jQuery symbol
declare var $: any;

@Component({
    selector: 'about',
    templateUrl: './about.component.html',
    styleUrls: ['./about.component.css'],
    standalone: false
})
export class AboutComponent implements OnInit {

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      var tab = params['tab'];

      $('.nav-tabs a[href="#' + tab + '"]').tab('show');
    });
  }

}
