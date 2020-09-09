import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'framework',
  templateUrl: './framework.component.html',
  styleUrls: ['./framework.component.css']
})
export class FrameworkComponent implements OnInit {

  frameworkSrc = "/assets/img/GSA IT Strategic Framework.pdf"

  constructor() { }

  ngOnInit(): void {
  }

}
