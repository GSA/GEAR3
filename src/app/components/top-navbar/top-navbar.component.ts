import { Component, OnInit } from '@angular/core';
import { SharedService } from '../../services/shared.service';

@Component({
  selector: 'top-navbar',
  templateUrl: './top-navbar.component.html',
  styleUrls: ['./top-navbar.component.css']
})
export class TopNavbarComponent implements OnInit {

  constructor(
    private sharedService: SharedService
  ) { }

  ngOnInit(): void {
  }

  toggleSidebar(){
    this.sharedService.toggleClick();    
  }

}
