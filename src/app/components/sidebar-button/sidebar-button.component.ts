import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';

import { SidebarButtonChild } from '@common/sidebar-classes';
import { AnalyticsService } from '@services/analytics/analytics.service';

@Component({
    selector: 'app-sidebar-button',
    templateUrl: './sidebar-button.component.html',
    styleUrls: ['./sidebar-button.component.scss'],
    standalone: false
})
export class SidebarButtonComponent implements OnChanges {

    @Input() buttonText: string = '';
    @Input() buttonIcon: string = '';
    @Input() buttonRoute: string = '';
    @Input() buttonChildren: SidebarButtonChild[] = [];
    @Input() isSidebarExpanded: boolean = false;

    @Input() isButtonExpanded: boolean = false;

    @Output() routeChange: EventEmitter<any> = new EventEmitter();

  
    constructor(
        private router: Router,
        private analyticsService: AnalyticsService
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
        if (this.hasChildren()) {
            // no toggle here anymore — parent handles it
        } else if (this.buttonRoute && this.router.url !== this.buttonRoute) {
            this.analyticsService.logClickEvent(this.buttonRoute);
            this.router.navigate([this.buttonRoute]);
        }
    }

    public onKeyUp(e: KeyboardEvent): void {
        if(e.key === ' ' || e.key === 'Enter') {
            this.onButtonClick();
        }
    }

    public onChildKeyUp(e: KeyboardEvent, child: SidebarButtonChild): void {
        if(e.key === ' ' || e.key === 'Enter') {
            this.onChildButtonClick(child);
        }
    }

    public onChildButtonClick(child: SidebarButtonChild): void {
        if(child.route) {
            this.analyticsService.logClickEvent(child.route);
            this.router.navigate([child.route]);
        } else if(child.href) {
            this.analyticsService.logClickEvent(child.href);
            window.open(child.href, '_blank');
        }
        this.routeChange.emit();
    }

    private hasChildren(): boolean {
        return this.buttonChildren && this.buttonChildren.length > 0;
    }

}