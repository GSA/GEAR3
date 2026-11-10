import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'ea-view',
    templateUrl: './ea-view.component.html',
    styleUrls: ['./ea-view.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class EAViewComponent implements OnInit {

  pdfHeight = 1000;

  constructor() { }

  ngOnInit(): void {
    
  }

}
