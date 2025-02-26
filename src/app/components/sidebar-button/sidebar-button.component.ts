import { Component, Input } from '@angular/core';

import { SidebarButtonChild } from '@common/sidebar-classes';

@Component({
    selector: 'app-sidebar-button',
    templateUrl: './sidebar-button.component.html',
    styleUrls: ['./sidebar-button.component.scss']
})
export class SidebarButtonComponent {

    @Input() buttonText: string = '';
    @Input() buttonIcon: string = '';
    @Input() buttonChildren: SidebarButtonChild[] = [];
    @Input() isSidebarExpanded: boolean = false;

    public isButtonExpanded: boolean = false;
  
    constructor() {
    }

    public onButtonClick(): void {
        this.isButtonExpanded = !this.isButtonExpanded;
    }

}