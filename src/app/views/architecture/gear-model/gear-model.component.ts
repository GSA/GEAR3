import { Component, ElementRef, OnInit } from '@angular/core';

@Component({
    selector: 'gear-model',
    templateUrl: './gear-model.component.html',
    styleUrls: ['./gear-model.component.scss'],
    standalone: false
})
export class GearModelComponent implements OnInit {

  public pdfWidth = 0;
  public pdfHeight = 0;

  constructor(private el: ElementRef) {}

  ngOnInit() {
    let parentElement = this.el.nativeElement.parentElement;
    while (parentElement && !parentElement.classList.contains('site-container')) {
      parentElement = parentElement.parentElement;
    }
    if (parentElement) {
      this.pdfWidth = parentElement.offsetWidth - 200;
      this.pdfHeight = parentElement.offsetHeight - 250;
    }
  }

}
