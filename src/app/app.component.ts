import { Component, OnInit } from '@angular/core';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'gear3';

  ngOnInit(){
    // Pad main Module by how big the top navbar is
    $(document).ready(this.setNavOffsets);
    $(window).resize(this.setNavOffsets);

    // Anything with rotate class, rotate to opposite side when clicked
    $(".rotate").click(function(){
      $(this).toggleClass("opposite")  ; 
     })

  }

  setNavOffsets() {
    // Top Navbar Offset
    let mainElem: HTMLElement = document.getElementById('mainModule');
    let topNavElem: HTMLElement = document.getElementById('topNav');
    mainElem.style['padding-top'] = `${topNavElem.offsetHeight}px`;

    // SideNavbar Offset
    let footerElem: HTMLElement = document.getElementById('footer');
    let sideNavElem: any = document.getElementsByTagName('ng-sidebar-container')[0];
    sideNavElem.style['height'] = `${window.innerHeight - topNavElem.offsetHeight - footerElem.offsetHeight}px`;
  }
}
