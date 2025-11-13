import { Component, OnInit } from '@angular/core';

@Component({
standalone: false,
  selector: 'gear-model',
  templateUrl: './gear-model.component.html',
  styleUrls: ['./gear-model.component.css']
})
export class GearModelComponent implements OnInit {

  pdfHeight = 640;

  constructor() { }

  ngOnInit(): void {
  }

}
