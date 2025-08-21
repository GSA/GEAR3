import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'ea-view',
    templateUrl: './ea-view.component.html',
    styleUrls: ['./ea-view.component.css'],
    standalone: false
})
export class EAViewComponent implements OnInit {

  pdfHeight = 1000;

  constructor() { }

  ngOnInit(): void {
    
  }

}
