import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'framework',
  templateUrl: './framework.component.html',
  styleUrls: ['./framework.component.scss']
})
export class FrameworkComponent implements OnInit {

  pdfHeight = 1000;

  constructor() { }

  ngOnInit(): void {
  }

}
