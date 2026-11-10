import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

import { SharedService } from "@services/shared/shared.service";

@Component({
    selector: 'home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class HomeComponent implements OnInit {

  constructor(private sharedService: SharedService) { }

  ngOnInit(): void {
  }

}
