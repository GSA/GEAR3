import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';

import { SidebarButtonChild } from '@common/sidebar-classes';

@Component({
    selector: 'app-sidebar-button',
    templateUrl: './sidebar-button.component.html',
    styleUrls: ['./sidebar-button.component.scss']
})
export class SidebarButtonComponent implements OnChanges {

    @Input() buttonText: string = '';
    @Input() buttonIcon: string = '';
    @Input() buttonRoute: string = '';
    @Input() buttonChildren: SidebarButtonChild[] = [];
    @Input() isSidebarExpanded: boolean = false;

    public isButtonExpanded: boolean = false;
  
    constructor(
        private router: Router
    ) {
    }

    public ngOnChanges(changes: SimpleChanges): void {
        if(changes && changes.isSidebarExpanded) {
            if(!changes.isSidebarExpanded.currentValue) {
                this.isButtonExpanded = false;
            }
        }
    }

    public onButtonClick(): void {
        if(this.hasChildren()) {
            this.isButtonExpanded = !this.isButtonExpanded;
        } else {
            if(this.buttonRoute) {
                this.router.navigate([this.buttonRoute]);
            }
        }
    }

    public onChildButtonClick(child: SidebarButtonChild): void {
        if(child.route) {
            this.router.navigate([child.route]);
        } else if(child.href) {
            window.open(child.href, '_blank');
        }
    }

    private hasChildren(): boolean {
        return this.buttonChildren && this.buttonChildren.length > 0;
    }

}