import { Component, OnInit } from '@angular/core';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'gear3';

  ngOnInit(){
    // Enable all popovers
    $(function () {
      $('[data-toggle="popover"]').popover()
    })
  }
}
