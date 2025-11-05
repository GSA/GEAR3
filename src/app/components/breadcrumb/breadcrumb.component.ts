import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-breadcrumb',
    templateUrl: './breadcrumb.component.html',
    styleUrls: ['./breadcrumb.component.scss'],
    standalone: false
})
export class BreadcrumbComponent implements OnInit {

    @Input() showManagerLevel: boolean = false;

    public currentSubPath: string = '';
    public fromSearchKw: string = '';

    private currentRoute: string[] = [];

    constructor(private route: ActivatedRoute) {
        this.currentRoute = this.route.snapshot.url.map(segment => segment.path);
        this.currentSubPath = this.currentRoute[0];
    }

    public ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            this.fromSearchKw = params['search'];
        });
    }

    public isFromSearch(): boolean {
        return this.fromSearchKw && this.fromSearchKw.length > 0
    }

    public getTopLevelRotueName(): string {
        const queryParams = this.route.snapshot.queryParams;
        const defaultSections = {
            'investments': 'IT Strategy',
            'capabilities': 'GSA Enterprise',
            'organizations': 'GSA Enterprise', 
            'website_service_category': 'GSA Enterprise',
            'systems': 'Business Systems',
            'systems_TIME': 'Business Systems',
            'records_mgmt': 'Business Systems',
            'websites': 'Business Systems',
            'FISMA': 'Security',
            'FISMA_POC': 'Security',
            'it_standards': 'Technologies',
            'it_standards_manager': 'Technologies'
        };
        
        const contextOverrides = {
            'investments': queryParams['fromCapability'] ? 'GSA Enterprise' : null,
            'capabilities': queryParams['fromSystem'] ? 'Business Systems' : null,
            'systems': queryParams['fromTechnology'] ? 'Technologies' : queryParams['fromCapability'] ? 'GSA Enterprise' : null,
            'it_standards': queryParams['fromSystem'] ? 'Business Systems' : null
        };
        
        return contextOverrides[this.currentSubPath as keyof typeof contextOverrides] || defaultSections[this.currentSubPath as keyof typeof defaultSections] || '';
    }

    public getSubLevelRotueName(): string {
        const queryParams = this.route.snapshot.queryParams;
        const contextMap = {
            'it_standards': { fromSystem: 'fromSystemName', default: 'Business Systems & Subsystems List' },
            'capabilities': { fromSystem: 'fromSystemName', default: 'Business Systems & Subsystems List' },
            'organizations': { fromCapability: 'fromCapabilityName', default: 'Business Capabilities List' },
            'systems': { fromTechnology: 'fromTechnologyName', fromCapability: 'fromCapabilityName', default: 'IT Standards List' },
            'websites': { fromSystem: 'fromSystemName', default: 'Business Systems & Subsystems List' },
            'records_mgmt': { fromSystem: 'fromSystemName', default: 'Business Systems & Subsystems List' },
            'investments': { fromCapability: 'fromCapabilityName', default: 'Business Capabilities List' }
        };
        
        const context = contextMap[this.currentSubPath as keyof typeof contextMap];
        if (context) {
            for (const [param, nameParam] of Object.entries(context)) {
                if (param !== 'default' && queryParams[param]) {
                    return queryParams[nameParam] || context.default;
                }
            }
        }
        
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
        const queryParams = this.route.snapshot.queryParams;
        const backRouteMap = {
            'it_standards_manager': 'it_standards',
            'it_standards': queryParams['fromSystem'] ? 'systems' : null,
            'capabilities': queryParams['fromSystem'] ? 'systems' : null,
            'organizations': queryParams['fromCapability'] ? 'capabilities' : null,
            'systems': queryParams['fromTechnology'] ? 'it_standards' : queryParams['fromCapability'] ? 'capabilities' : null,
            'websites': queryParams['fromSystem'] ? 'systems' : null,
            'records_mgmt': queryParams['fromSystem'] ? 'systems' : null,
            'investments': queryParams['fromCapability'] ? 'capabilities' : null
        };
        
        return backRouteMap[this.currentSubPath as keyof typeof backRouteMap] || this.currentSubPath;
    }

    public getBackRouteWithParams(): string[] {
        const queryParams = this.route.snapshot.queryParams;
        const routeMap = {
            'it_standards': queryParams['fromSystem'] ? ['/systems', queryParams['fromSystem']] : null,
            'capabilities': queryParams['fromSystem'] ? ['/systems', queryParams['fromSystem']] : null,
            'organizations': queryParams['fromCapability'] ? ['/capabilities', queryParams['fromCapability']] : null,
            'systems': queryParams['fromTechnology'] ? ['/it_standards', queryParams['fromTechnology']] : 
                     queryParams['fromCapability'] ? ['/capabilities', queryParams['fromCapability']] : null,
            'websites': queryParams['fromSystem'] ? ['/systems', queryParams['fromSystem']] : null,
            'records_mgmt': queryParams['fromSystem'] ? ['/systems', queryParams['fromSystem']] : null,
            'investments': queryParams['fromCapability'] ? ['/capabilities', queryParams['fromCapability']] : null
        };
        
        return routeMap[this.currentSubPath as keyof typeof routeMap] || ['/' + this.getBackRoute()];
    }

    public getGlobalSearchBack(): string {
        return `/search/${this.fromSearchKw}`;
    }
}