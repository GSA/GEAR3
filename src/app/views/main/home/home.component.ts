import { Component, OnInit } from '@angular/core';

import { SharedService } from "../../../services/shared/shared.service";

@Component({
  selector: 'home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  constructor(private sharedService: SharedService) { }

  ngOnInit(): void {
    this.setJWT();
  }

  // Set JWT when Logging in
  setJWT () {
    this.sharedService.setJWTonLogIn();
  }

}
