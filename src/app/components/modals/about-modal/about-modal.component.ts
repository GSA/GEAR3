import { Component, OnInit } from '@angular/core';

declare var $: any;

@Component({
  selector: 'about-modal',
  templateUrl: './about-modal.component.html',
  styleUrls: ['./about-modal.component.scss']
})
export class AboutModalComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    // Initialize any necessary functionality
  }

  public openModal(): void {
    $('#aboutModal').modal('show');
  }

  public closeModal(): void {
    $('#aboutModal').modal('hide');
  }
}