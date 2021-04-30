import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-g-invoicing',
  templateUrl: './g-invoicing.component.html',
  styleUrls: ['./g-invoicing.component.css']
})
export class GInvoicingComponent implements OnInit {

  pdfHeight = 480;

  constructor() { }

  ngOnInit(): void {
  }

}
