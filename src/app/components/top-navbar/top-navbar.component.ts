import { Component, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'top-navbar',
  templateUrl: './top-navbar.component.html',
  styleUrls: ['./top-navbar.component.css']
})
export class TopNavbarComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

  @Output() _toggleOpened: EventEmitter<any> = new EventEmitter();

}
