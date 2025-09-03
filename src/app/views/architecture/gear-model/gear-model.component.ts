import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'gear-model',
    templateUrl: './gear-model.component.html',
    styleUrls: ['./gear-model.component.scss'],
    standalone: false
})
export class GearModelComponent implements OnInit {

  pdfHeight = 640;

  constructor() { }

  ngOnInit(): void {
  }

}
