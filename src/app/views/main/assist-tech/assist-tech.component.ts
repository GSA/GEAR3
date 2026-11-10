import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'assist-tech',
    templateUrl: './assist-tech.component.html',
    styleUrls: ['./assist-tech.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class AssistTechComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
