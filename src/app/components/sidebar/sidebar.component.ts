import { Component, OnInit } from '@angular/core';
import { SharedService } from '@services/shared/shared.service';
@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {

  public isSidebarVisible: boolean = false;
  
  constructor(public sharedService: SharedService) {
  }

  public ngOnInit(): void {
    this.sharedService.sidebarVisible.subscribe(s => {
      this.isSidebarVisible = s;

      if(s) {
        // timeout is here because the sidebar isn't rendered fully yet
        setTimeout(() => {
          // get a list of all the sidebar links and set focus to the first one
          const sidebarLinks = document.getElementsByClassName('p-accordion-header-link');
          (sidebarLinks[0] as HTMLElement).focus();

          // watch for focus to leave each link and when it does close the sidebar if we aren't focused
          // on one of them anymore
          for(let i = 0; i < sidebarLinks.length; i++) {
            sidebarLinks[i].addEventListener('blur', (event: FocusEvent) => {
              let target = (event.relatedTarget as HTMLAnchorElement);
              //if(!(event.relatedTarget as HTMLAnchorElement).classList.contains('p-accordion-header-link')) {
              console.log(i)
              if(!target.classList.contains('p-accordion-header-link') && !target.classList.contains('sidebar-sublink')) { 
                this.closeSidebar();
                return;
              }
            });
          }
        }, 0);
      }
    });
  }

  public closeSidebar() {
    this.sharedService.closeSidebar();
  }
}
