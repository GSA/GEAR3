import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NavEntry, PreviousRouteService } from '@services/previous-route/previous-route.service';

interface RouteMeta {
  section: string;
  listName: string;
  listRoute: string;
}

const ROUTE_META: Record<string, RouteMeta> = {
  investments:              { section: 'IT Strategy',      listName: 'IT Investment List',                    listRoute: '/investments' },
  strategic_framework:      { section: 'IT Strategy',      listName: 'IT Investment List',                    listRoute: '/investments' },
  capabilities:             { section: 'GSA Enterprise',   listName: 'Business Capabilities List',            listRoute: '/capabilities' },
  capabilities_model:       { section: 'GSA Enterprise',   listName: 'GSA Capabilities Model',               listRoute: '/capabilities_model' },
  capabilities_manager:     { section: 'GSA Enterprise',   listName: 'Business Capabilities List',            listRoute: '/capabilities' },
  organizations:            { section: 'GSA Enterprise',   listName: 'GSA Organizations List',               listRoute: '/organizations' },
  org_chart:                { section: 'GSA Enterprise',   listName: 'GSA Organizations Chart',              listRoute: '/org_chart' },
  website_service_category: { section: 'GSA Enterprise',   listName: 'GSA Website Service Categories List',  listRoute: '/website_service_category' },
  systems:                  { section: 'Business Systems', listName: 'Business Systems and Subsystems',      listRoute: '/systems' },
  systems_manager:          { section: 'Business Systems', listName: 'Business Systems and Subsystems',      listRoute: '/systems' },
  systems_TIME:             { section: 'Business Systems', listName: 'Systems TIME Report',                  listRoute: '/systems_TIME' },
  records_mgmt:             { section: 'Business Systems', listName: 'Record Retention Schedules',           listRoute: '/records_mgmt' },
  records_mgmt_manager:     { section: 'Business Systems', listName: 'Record Retention Schedules',           listRoute: '/records_mgmt' },
  websites:                 { section: 'Business Systems', listName: 'GSA Websites',                         listRoute: '/websites' },
  websites_manager:         { section: 'Business Systems', listName: 'GSA Websites',                         listRoute: '/websites' },
  FISMA:                    { section: 'Security',         listName: 'FISMA Systems Inventory',              listRoute: '/FISMA' },
  FISMA_POC:                { section: 'Security',         listName: 'GSA FISMA System Points of Contact',   listRoute: '/FISMA_POC' },
  it_standards:             { section: 'Technologies',     listName: 'GSA IT Standards',                     listRoute: '/it_standards' },
  it_standards_manager:     { section: 'Technologies',     listName: 'GSA IT Standards',                     listRoute: '/it_standards' },
  tech_categories:          { section: 'Technologies',     listName: 'Technology Reference Model',           listRoute: '/tech_categories' },
  tech_categories_model:    { section: 'Technologies',     listName: 'Technology Categories Model',          listRoute: '/tech_categories_model' },
};

@Component({
    selector: 'app-breadcrumb',
    templateUrl: './breadcrumb.component.html',
    styleUrls: ['./breadcrumb.component.scss'],
    standalone: false
})
export class BreadcrumbComponent implements OnInit {

    @Input() showManagerLevel: boolean = false;

    public tableSearchTerm: string;
    public previousRouteWithoutParams: string;
    public topLevelName: string = '';
    public previousLevelName: string = '';

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private previousRouteService: PreviousRouteService
    ) {}

    public ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            this.tableSearchTerm = params['tableSearchTerm'];
        });

        this.buildBreadcrumb();
    }

    private buildBreadcrumb(): void {
        const currentParams = new URLSearchParams(this.router.url.split('?')[1] ?? '');
        const fromPrevious = currentParams.get('fromPrevious');
        const onBack = currentParams.get('onBack');

        const currentBase = this.route.snapshot.url[0]?.path ?? '';
        const currentMeta = ROUTE_META[currentBase];

        const prevEntry: NavEntry | null = this.previousRouteService.getPreviousEntry();
        const prevUrl = prevEntry?.url ?? null;
        const prevPath = prevUrl ? prevUrl.split('?')[0].split(';')[0] : null;

        if (prevPath && !onBack) {
            this.previousRouteWithoutParams = prevPath;
            const prevSegments = prevPath.split('/').filter(s => s);
            const prevBase = prevSegments[0] ?? '';
            const prevMeta = ROUTE_META[prevBase];

            if (prevPath === '/') {
                this.topLevelName = '';
                this.previousLevelName = 'Dashboard';
            } else if (prevPath.startsWith('/search')) {
                this.topLevelName = '';
                this.previousLevelName = 'Global Search';
            } else if (prevSegments.length === 1) {
                // Previous page was a list page
                this.topLevelName = currentMeta?.section ?? '';
                this.previousLevelName = prevMeta?.listName ?? prevBase;
            } else {
                // Previous page was a detail or manager page — use its stored title, then fromPrevious param
                this.topLevelName = '';
                this.previousLevelName = prevEntry.title ?? fromPrevious ?? prevMeta?.listName ?? '';
            }
        } else {
            // No navigation history (direct URL, page refresh) or user clicked back
            // Fall back to the parent list for this route
            this.topLevelName = currentMeta?.section ?? '';
            this.previousLevelName = fromPrevious ?? currentMeta?.listName ?? '';
            this.previousRouteWithoutParams = currentMeta?.listRoute ?? `/${currentBase}`;
        }
    }

    public onBack(): void {
        const queryParams: Record<string, any> = { onBack: true };
        if (this.tableSearchTerm) {
            queryParams['tableSearchTerm'] = this.tableSearchTerm;
        }
        this.router.navigate([this.previousRouteWithoutParams], { queryParams });
    }
}
