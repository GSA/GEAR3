import { Location } from '@angular/common';
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ActivatedRoute, NavigationEnd, NavigationStart, Router } from '@angular/router';
import { PreviousRouteService } from '@services/previous-route/previous-route.service';
import { filter } from 'rxjs/operators';

@Component({
    selector: 'app-breadcrumb',
    templateUrl: './breadcrumb.component.html',
    styleUrls: ['./breadcrumb.component.scss'],
    standalone: false
})
export class BreadcrumbComponent implements OnInit, OnChanges {

    @Input() showManagerLevel: boolean = false;

    // public currentSubPath: string = '';
    // public fromSearchKw: string = '';
    public tableSearchTerm: string;
    
    // private currentRoute: string[] = [];
    public previousRoute: string;
    public previousRouteWithoutParams: string;

    public topLevelName: string = '';
    public previousLevelName: string = '';

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private previousRouteService: PreviousRouteService,
        private location: Location
    ) {
        // this.currentRoute = this.route.snapshot.url.map(segment => segment.path);
        // this.currentSubPath = this.currentRoute[0];
    }

    public ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            // this.fromSearchKw = params['search'];
            this.tableSearchTerm = params['tableSearchTerm'];
        });

        this.previousRoute = this.previousRouteService.getPreviousUrl();
        this.previousRouteWithoutParams = this.previousRouteService.getPreviousRouteWithoutParams();

        this.topLevelName = this.getTopLevelRouteName(this.previousRoute);
        this.previousLevelName = this.getPreviousRouteName(this.previousRoute);
    }

    public ngOnChanges(changes: SimpleChanges): void {
        
    }

    private getTopLevelRouteName(previous: string): string {
        previous = previous?.split('?')[0].split(';')[0];
        const segments = this.route.snapshot.url;
        const currentBaseRouteName = segments[0].path;
        const params = new URLSearchParams(this.router.url.split('?')[1]);
        const fromBack = params.get('onBack');
        if(((previous === `/${currentBaseRouteName}`) || !previous) || fromBack) {
            switch (currentBaseRouteName) {
                case 'search':
                    return '';
                case 'strategic_framework':
                case 'investments':
                    return 'IT Strategy';
                case 'capabilities_model':
                case 'capabilities':
                case 'org_chart':
                case 'organizations':
                case 'website_service_category':
                    return 'GSA Enterprise';
                case 'systems':
                case 'systems_manager':
                case 'systems_TIME':
                case 'records_mgmt':
                case 'records_mgmt_manager':
                case 'websites':
                case 'websites_manager':
                    return 'Business Systems';
                case 'FISMA':
                case 'FISMA_POC':
                    return 'Security';
                case 'it_standards':
                case 'it_standards_manager':
                case 'tech_categories':
                case 'tech_categories_model':
                    return 'Technologies';
                default:
                    return '';
            }
        } else {
            return '';
        }
    }

    private getPreviousRouteName(previous: string): string {
        previous = previous?.split('?')[0].split(';')[0];
        const params = new URLSearchParams(this.router.url.split('?')[1]);
        const previousRouteQueryParamName = params.get('fromPrevious');
        const fromBack = params.get('onBack');
        if(previous && !fromBack) {
            if(previous === '/') {
                return 'Dashboard'
            }
            if(previous === '/investments') {
                return 'IT Investment List';
            }
            if(previous.startsWith('/investments/')) {
                return previousRouteQueryParamName;
            }
            if(previous === '/capabilities') {
                return 'Business Capabilities List';
            }
            if(previous.startsWith('/capabilities/')) {
                return previousRouteQueryParamName;
            }
            if(previous === '/capabilities_model') {
                return 'GSA Capabilities Model';
            }
            if(previous === '/org_chart') {
                return 'GSA Organizations Chart';
            }
            if(previous === '/organizations') {
                return 'GSA Organizations List';
            }
            if(previous.startsWith('/organizations/')) {
                return previousRouteQueryParamName;
            }
            if(previous === '/website_service_category') {
                return 'GSA Website Service Categories List';
            }
            if(previous.startsWith('/website_service_category/')) {
                return previousRouteQueryParamName;
            }
            if(previous === '/systems') {
                return 'Business Systems and Subsystems';
            }
            if(previous.startsWith('/systems/')) {
                return previousRouteQueryParamName;
            }
            if(previous === '/systems_TIME') {
                return 'Systems TIME Report';
            }
            if(previous.startsWith('/systems_TIME/')) {
                return previousRouteQueryParamName;
            }
            if(previous === '/records_mgmt') {
                return 'Record Retention Schedules';
            }
            if(previous.startsWith('/records_mgmt/')) {
                return previousRouteQueryParamName;
            }
            if(previous === '/websites') {
                return 'GSA Websites';
            }
            if(previous.startsWith('/websites/')) {
                return previousRouteQueryParamName;
            }
            if(previous === '/FISMA') {
                return 'FISMA Systems Inventory';
            }
            if(previous.startsWith('/FISMA/')) {
                return previousRouteQueryParamName;
            }
            if(previous === '/FISMA_POC') {
                return 'GSA FISMA System Points of Contact';
            }
            if(previous.startsWith('/FISMA_POC/')) {
                return previousRouteQueryParamName;
            }
            if(previous === '/it_standards') {
                return 'GSA IT Standards';
            }
            if(previous.startsWith('/it_standards/')) {
                return previousRouteQueryParamName;
            }
            if(previous === '/tech_categories') {
                return 'Technology Reference Model';
            }
            if(previous.startsWith('/tech_categories/')) {
                return previousRouteQueryParamName;
            }
            if(previous === '/tech_categories_model') {
                return 'Technology Categories Model';
            }
            if(previous.startsWith('/tech_categories_model/')) {
                return previousRouteQueryParamName;
            }
            if(previous.startsWith('search')) {
             return 'Global Search';
            }
        } else {
            const segments = this.route.snapshot.url;
            const currentBaseRouteName = segments[0].path;
            if(currentBaseRouteName === 'capabilities') {
                this.previousRouteWithoutParams = '/capabilities';
                return 'GSA Business Capabilities List';
            }
            if(currentBaseRouteName === 'capabilities_manager') {
                this.previousRouteWithoutParams = '/capabilities';
                return 'GSA Business Capabilities List';
            }
            if(currentBaseRouteName === 'organizations') {
                this.previousRouteWithoutParams = '/organizations';
                return 'GSA Organizations List';
            }
            if(currentBaseRouteName === 'website_service_category') {
                this.previousRouteWithoutParams = '/website_service_category';
                return 'GSA Website Service Categories List';
            }
            if(currentBaseRouteName === 'FISMA') {
                this.previousRouteWithoutParams = '/FISMA';
                return 'FISMA Systems Inventory';
            }
            if(currentBaseRouteName === 'FISMA_POC') {
                this.previousRouteWithoutParams = '/FISMA_POC';
                return 'GSA FISMA System Points of Contact';
            }
            if(currentBaseRouteName === 'investments') {
                this.previousRouteWithoutParams = '/investments';
                return 'IT Investments';
            }
            if(currentBaseRouteName === 'records_mgmt') {
                this.previousRouteWithoutParams = '/records_mgmt';
                return 'Record Retention Schedules';
            }
            if(currentBaseRouteName === 'records_mgmt_manager') {
                this.previousRouteWithoutParams = '/records_mgmt';
                return 'Record Retention Schedules';
            }
            if(currentBaseRouteName === 'systems') {
                this.previousRouteWithoutParams = '/systems';
                return 'Business Systems & Subsystems';
            }
            if(currentBaseRouteName === 'systems_manager') {
                this.previousRouteWithoutParams = '/systems';
                return 'Business Systems & Subsystems';
            }
            if(currentBaseRouteName === 'systems_TIME') {
                this.previousRouteWithoutParams = '/systems_TIME';
                return 'Systems TIME Report';
            }
            if(currentBaseRouteName === 'websites') {
                this.previousRouteWithoutParams = '/websites';
                return 'GSA Websites';
            }
            if(currentBaseRouteName === 'websites_manager') {
                this.previousRouteWithoutParams = '/websites';
                return 'GSA Websites';
            }
            if(currentBaseRouteName === 'it_standards') {
                this.previousRouteWithoutParams = '/it_standards';
                return 'GSA IT Standards';
            }
            if(currentBaseRouteName === 'it_standards_manager') {
                this.previousRouteWithoutParams = '/it_standards';
                return 'GSA IT Standards';
            }
            if(currentBaseRouteName === 'tech_categories') {
                this.previousRouteWithoutParams = '/tech_categories';
                return 'Technology Reference Model';
            }
        }
    }

    public onBack(): void {
        // const url = new URL(this.previousRoute);
        // url.search = ''; // Set the search part to an empty string
        // const urlWithoutParams = url.toString();
        if(this.tableSearchTerm) {
            this.router.navigate([this.previousRouteWithoutParams], 
                { queryParams: { tableSearchTerm: this.tableSearchTerm, onBack: true } }
            );
        } else {
            this.router.navigate([this.previousRouteWithoutParams], { queryParams: { onBack: true } });
        }
    }

    // public isFromSearch(): boolean {
    //     return this.fromSearchKw && this.fromSearchKw.length > 0
    // }

    // public getTopLevelRotueName(): string {
    //     const queryParams = this.route.snapshot.queryParams;
    //     const defaultSections = {
    //         'investments': 'IT Strategy',
    //         'capabilities': 'GSA Enterprise',
    //         'capabilities_manager': 'GSA Enterprise',
    //         'organizations': 'GSA Enterprise', 
    //         'website_service_category': 'GSA Enterprise',
    //         'systems': 'Business Systems',
    //         'systems_manager': 'Business Systems',
    //         'systems_TIME': 'Business Systems',
    //         'records_mgmt': 'Business Systems',
    //         'records_mgmt_manager': 'Business Systems',
    //         'websites': 'Business Systems',
    //         'websites_manager': 'Business Systems',
    //         'FISMA': 'Security',
    //         'FISMA_POC': 'Security',
    //         'it_standards': 'Technologies',
    //         'it_standards_manager': 'Technologies'
    //     };
        
    //     const contextOverrides = {
    //         'investments': queryParams['fromCapability'] ? 'GSA Enterprise' : null,
    //         'capabilities': queryParams['fromSystem'] ? 'Business Systems' : null,
    //         'systems': queryParams['fromTechnology'] ? 'Technologies' : queryParams['fromCapability'] ? 'GSA Enterprise' : null,
    //         'it_standards': queryParams['fromSystem'] ? 'Business Systems' : null
    //     };
        
    //     return contextOverrides[this.currentSubPath as keyof typeof contextOverrides] || defaultSections[this.currentSubPath as keyof typeof defaultSections] || '';
    // }

    // public getSubLevelRotueName(): string {
    //     const queryParams = this.route.snapshot.queryParams;
    //     const contextMap = {
    //         'it_standards': { fromSystem: 'fromSystemName', fromTechCats: queryParams['fromTechCats'], default: 'Business Systems & Subsystems List' },
    //         'capabilities': { fromCapModel: 'fromCapModel', fromSystem: 'fromSystemName', default: 'Business Systems & Subsystems List' },
    //         'organizations': { fromOrgChart: 'fromOrgChart', fromCapability: 'fromCapabilityName', default: 'Business Capabilities List' },
    //         'systems': { fromTechnology: 'fromTechnologyName', fromCapability: 'fromCapabilityName', default: 'IT Standards List' },
    //         'websites': { fromSystem: 'fromSystemName', default: 'Business Systems & Subsystems List' },
    //         'records_mgmt': { fromSystem: 'fromSystemName', default: 'Business Systems & Subsystems List' },
    //         'investments': { fromCapability: 'fromCapabilityName', default: 'Business Capabilities List' },
    //     };
        
    //     const context = contextMap[this.currentSubPath as keyof typeof contextMap];
    //     if (context) {
    //         for (const [param, nameParam] of Object.entries(context)) {
    //             if (param !== 'default' && queryParams[param]) {
    //                 return queryParams[nameParam] || context.default;
    //             }
    //         }
    //     }
        
    //     switch (this.currentSubPath) {
    //         case 'investments':
    //             return 'IT Investments List';
    //         case 'capabilities':
    //             return 'Business Capabilities List';
    //         case 'capabilities_manager':
    //             return 'Business Capabilities List';
    //         case 'organizations':
    //             return 'Organizations List';
    //         case 'website_service_category':
    //             return 'Website Service Categories List';
    //         case 'systems':
    //             return 'Business Systems & Subsystems List';
    //         case 'systems_manager':
    //             return 'Business Systems & Subsystems List';
    //         case 'systems_TIME':
    //             return 'Systems TIME Report List';
    //         case 'records_mgmt':
    //             return 'Record Retention Schedules List';
    //         case 'records_mgmt_manager':
    //             return 'Record Retention Schedules List';
    //         case 'websites':
    //             return 'Websites List';
    //         case 'websites_manager':
    //             return 'Websites List';
    //         case 'FISMA':
    //             return 'FISMA Systems Inventory List';
    //         case 'FISMA_POC':
    //             return 'FISMA System Points of Contact List';
    //         case 'it_standards':
    //             return 'IT Standards List';
    //         case 'it_standards_manager':
    //             return 'IT Standards List';
    //         default:
    //             return '';
    //     }
    // }

    // public getBackRoute(): string {
    //     const queryParams = this.route.snapshot.queryParams;
    //     const backRouteMap = {
    //         'it_standards_manager': 'it_standards',
    //         'it_standards': queryParams['fromSystem'] ? 'systems' : queryParams['fromTechCats'] ? 'tech_categories/' + queryParams['techCatId'] : null,
    //         'capabilities': queryParams['fromSystem'] ? 'systems' : queryParams['fromCapModel'] ? 'capabilities_model' : null,
    //         'capabilities_manager': 'capabilities',
    //         'organizations': queryParams['fromCapability'] ? 'capabilities' : queryParams['fromOrgChart'] ? 'org_chart' : null,
    //         'systems': queryParams['fromTechnology'] ? 'it_standards' : queryParams['fromCapability'] ? 'capabilities' : null,
    //         'systems_manager': 'systems',
    //         'websites': queryParams['fromSystem'] ? 'systems' : null,
    //         'websites_manager': 'websites',
    //         'records_mgmt': queryParams['fromSystem'] ? 'systems' : null,
    //         'records_mgmt_manager': 'records_mgmt',
    //         'investments': queryParams['fromCapability'] ? 'capabilities' : null
    //     };
    //     return backRouteMap[this.currentSubPath as keyof typeof backRouteMap] || this.currentSubPath;
    // }

    // public getBackRouteWithParams(): string[] {
    //     const queryParams = this.route.snapshot.queryParams;
    //     const routeMap = {
    //         'it_standards': queryParams['fromSystem'] ? ['/systems', queryParams['fromSystem']] : queryParams['fromTechCats'] ? ['tech_categories/' + queryParams['techCatId']] : null,
    //         'capabilities': queryParams['fromSystem'] ? ['/systems', queryParams['fromSystem']] : queryParams['fromCapModel'] ? 'capabilities_model' : null,
    //         'organizations': queryParams['fromCapability'] ? ['/capabilities', queryParams['fromCapability']] : queryParams['fromOrgChart'] ? 'org_chart': null,
    //         'systems': queryParams['fromTechnology'] ? ['/it_standards', queryParams['fromTechnology']] : 
    //                  queryParams['fromCapability'] ? ['/capabilities', queryParams['fromCapability']] : null,
    //         'websites': queryParams['fromSystem'] ? ['/systems', queryParams['fromSystem']] : null,
    //         'websites_manager': null,
    //         'records_mgmt_manager': null,
    //         'systems_manager': null,
    //         'capabilities_manager': null,
    //         'records_mgmt': queryParams['fromSystem'] ? ['/systems', queryParams['fromSystem']] : null,
    //         'investments': queryParams['fromCapability'] ? ['/capabilities', queryParams['fromCapability']] : null
    //     };
    //     return routeMap[this.currentSubPath as keyof typeof routeMap] || ['/' + this.getBackRoute()];
    // }

    // public getGlobalSearchBack(): string {
    //     return `/search/${this.fromSearchKw}`;
    // }

    // public onBackClick(): void {
    //     const route = this.getBackRouteWithParams();
    //     this.router.navigate([route], {
    //         queryParams: { tableSearchTerm: this.tableSearchTerm }
    //     });
    // }

    // public onGlobalBackClick(): void {
    //     const route = this.getGlobalSearchBack();
    //     this.router.navigate([route], {
    //         queryParams: { tableSearchTerm: this.tableSearchTerm }
    //     });
    // }
}