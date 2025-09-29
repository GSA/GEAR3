import { Component, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-breadcrumb',
    templateUrl: './breadcrumb.component.html',
    styleUrls: ['./breadcrumb.component.scss'],
    standalone: false
})
export class BreadcrumbComponent {

    @Input() showManagerLevel: boolean = false;

    public currentSubPath: string = '';
    private currentRoute: string[] = [];

  
    constructor(private route: ActivatedRoute) {
        this.currentRoute = this.route.snapshot.url.map(segment => segment.path);
        this.currentSubPath = this.currentRoute[0];
    }

    public getTopLevelRotueName(): string {
        if(this.currentSubPath === 'investments') {
            return 'IT Strategy';
        } else if(this.currentSubPath === 'capabilities' || this.currentSubPath === 'organizations' || this.currentSubPath === 'website_service_category') {
            return 'GSA Enterprise';
        } else if(this.currentSubPath === 'systems' || this.currentSubPath === 'systems_TIME' || this.currentSubPath === 'records_mgmt' || this.currentSubPath === 'websites') {
            return 'Business Systems';
        } else if(this.currentSubPath === 'FISMA' || this.currentSubPath === 'FISMA_POC') {
            return 'Security';
        } else if(this.currentSubPath === 'it_standards' || this.currentSubPath === 'it_standards_manager') {
            return 'Technologies';
        }
        return '';
    }

    public getSubLevelRotueName(): string {
        switch (this.currentSubPath) {
            case 'investments':
                return 'IT Investments List';
            case 'capabilities':
                return 'Business Capabilities List';
            case 'organizations':
                return 'Organizations List';
            case 'website_service_category':
                return 'Website Service Categories List';
            case 'systems':
                return 'Business Systems & Subsystems List';
            case 'systems_TIME':
                return 'Systems TIME Report List';
            case 'records_mgmt':
                return 'Record Retention Schedules List';
            case 'websites':
                return 'Websites List';
            case 'FISMA':
                return 'FISMA Systems Inventory List';
            case 'FISMA_POC':
                return 'FISMA System Points of Contact List';
            case 'it_standards':
                return 'IT Standards List';
            case 'it_standards_manager':
                return 'IT Standards List';
            default:
                return '';
        }
    }

    public getBackRoute(): string {
        if(this.currentSubPath === 'it_standards_manager') {
            return 'it_standards';
        }
        return this.currentSubPath;
    }
}