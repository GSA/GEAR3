import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { ApiService } from '@services/apis/api.service';
import { ModalsService } from '@services/modals/modals.service';
import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';
import { Title } from '@angular/platform-browser';

import { ITStandards } from '@api/models/it-standards.model';
import { DataDictionary } from '@api/models/data-dictionary.model';
import { Column } from '@common/table-classes';

// Declare jQuery symbol
// declare var $: any;

@Component({
    selector: 'it-standards',
    templateUrl: './it-standards.component.html',
    styleUrls: ['./it-standards.component.scss'],
    standalone: false
})
export class ItStandardsComponent implements OnInit, OnDestroy {

  attrDefinitions: DataDictionary[] = [];

  public tableCols: Column[] = [];
  public selectedTab: string = 'All';
  public filterTotals: any = null;
  public totalRecords: number = 0;
  public filterChips: string[] = ['Mobile', 'Desktop', 'Server', 'SaaS', 'PaaS', 'Other'];
  private selectedChips: string[] = [];

  public daysExpiring: number = 0;
  public daysRetired: number = 0;
  public includePastDueExpirations: boolean = false;
  public pastDueOnly: boolean = false;

  // Sticky paging/sort/search state, preserved across tab and chip changes.
  private currentSortField: string = 'Name';
  private currentSortOrder: number = 1;
  private currentSearch: string = '';
  private currentPageSize: number = 50;

  private queryParamsSubscription?: Subscription;

  constructor(
    private apiService: ApiService,
    private modalService: ModalsService,
    private route: ActivatedRoute,
    public sharedService: SharedService,
    private tableService: TableService,
    private titleService: Title,
    private router: Router
  ) {
    // this.modalService.currentITStand.subscribe((row) => (this.row = row));
  }

  public isLoggedIn(): boolean {
    return this.sharedService.loggedIn;
  }

  public onCreateNew(): void {
    this.router.navigate(['/it_standards_manager']);
  }

  public onSelectTab(tabName: string): void {
    this.selectedTab = tabName;
    this.syncUrlToFilters();
    this.loadPage({
      page: 1,
      pageSize: this.currentPageSize,
      sortField: this.currentSortField,
      sortOrder: this.currentSortOrder,
      search: this.currentSearch,
    });
  }

  public onKeyUp(e: KeyboardEvent, tabName: string) {
    if (e.key === ' ' || e.key === 'Enter') {
      this.onSelectTab(tabName);
    }
  }

  public onFilterChipSelect(selectedChips: string[]): void {
    this.selectedChips = selectedChips;
    this.syncUrlToFilters();
    this.loadPage({
      page: 1,
      pageSize: this.currentPageSize,
      sortField: this.currentSortField,
      sortOrder: this.currentSortOrder,
      search: this.currentSearch,
    });
    this.refreshTotals();
  }

  public isTabSelected(tabName: string): boolean {
    return this.selectedTab === tabName;
  }

  private syncUrlToFilters(): void {
    const chip = this.selectedChips.length === 1 ? this.selectedChips[0] : null;
    const tab = this.selectedTab;

    if (chip && tab && tab !== 'All') {
      this.router.navigate(['/it_standards/filtered', chip, tab], { replaceUrl: true });
    } else if (chip) {
      this.router.navigate(['/it_standards/filtered', chip], { replaceUrl: true });
    } else {
      this.router.navigate(['/it_standards'], { replaceUrl: true });
    }
  }

  private YesNo(value: any, row: any, index: number, field: string): string {
    return value === 'T' ? "Yes" : "No";
  }

  private refreshTotals(): void {
    this.apiService.getITStandardsFilterTotals(this.selectedChips).subscribe(totals => {
      this.filterTotals = totals;
    });
  }

  public loadPage(event: { page: number; pageSize: number; sortField: string; sortOrder: number; search: string }): void {
    this.currentSortField = event.sortField || 'Name';
    this.currentSortOrder = event.sortOrder || 1;
    this.currentSearch = event.search || '';
    this.currentPageSize = event.pageSize || this.currentPageSize;

    this.tableService.updateReportTableDataReadyStatus(false);
    this.apiService.getITStandardsPaginated(
      event.page,
      this.currentPageSize,
      this.currentSortField,
      this.currentSortOrder,
      this.currentSearch,
      this.selectedTab,
      this.selectedChips,
      this.daysExpiring,
      this.daysRetired,
      this.pastDueOnly,
      this.includePastDueExpirations
    ).subscribe(result => {
      const dataWithConditionStatus = this.setCondtionStatus(result.data);
      this.totalRecords = result.total;
      this.tableService.updateReportTableData(dataWithConditionStatus);
      this.tableService.updateReportTableDataReadyStatus(true);
    });
  }

  ngOnInit(): void {
    /*
    * Get definitions for the table header tooltips
    * Then set the column defintions and initialize the table
    */

    // Support deep-link filtered URLs: /it_standards/filtered/:deploymentType/:status
    const routeParams = this.route.snapshot.params;
    if (routeParams['deploymentType']) {
      const depType = routeParams['deploymentType'];
      const match = this.filterChips.find(c => c.toLowerCase() === depType.toLowerCase());
      if (match) {
        this.selectedChips = [match];
      }
    }
    if (routeParams['status']) {
      const status = routeParams['status'];
      this.selectedTab = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    }

    this.queryParamsSubscription = this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        this.selectedTab = params['tab'];
      }
      if (params['expiringWithinDays']) {
        this.daysExpiring = +params['expiringWithinDays'];
      }
      if (params['includePastDue']) {
        this.includePastDueExpirations = params['includePastDue'] === 'true';
      }
      if (params['pastDueOnly']) {
        this.pastDueOnly = params['pastDueOnly'] === 'true';
      }
      if (params['retiredWithinDays']) {
        this.daysRetired = +params['retiredWithinDays'];
      }
    });

    // Set JWT when logged into GEAR Manager when returning from secureAuth
    this.sharedService.setJWTonLogIn();

    this.apiService.getDataDictionaryByReportName('IT Standards List').subscribe(defs => {
      this.attrDefinitions = defs;

      // IT Standard Table Columns
      this.tableCols = [{
        field: 'ID',
        header: 'ID',
        isSortable: true,
        showColumn: false,
        titleTooltip: this.sharedService.getTooltip(this.attrDefinitions, 'ID')
      }, {
        field: 'Name',
        header: 'IT Standard Name',
        isSortable: true,
        showColumn: true,
        titleTooltip: this.sharedService.getTooltip(this.attrDefinitions, 'IT Standard Name')
      },
      {
        field: 'ApprovedVersions',
        header: 'Approved Versions',
        isSortable: false,
        showColumn: true,
        titleTooltip: this.sharedService.getTooltip(this.attrDefinitions, 'Approved Versions')
      }, {
        field: 'ManufacturerName',
        header: 'Manufacturer',
        isSortable: true,
        titleTooltip: this.sharedService.getTooltip(this.attrDefinitions, 'Manufacturer Name')
      }, {
        field: 'Description',
        header: 'Description',
        isSortable: true,
        showColumn: true,
        formatter: this.sharedService.formatDescriptionLite,
        titleTooltip: this.sharedService.getTooltip(this.attrDefinitions, 'Description')
      }, {
        field: 'Status',
        header: 'Status',
        isSortable: true,
        formatter: this.sharedService.formatStatus,
        titleTooltip: this.sharedService.getTooltip(this.attrDefinitions, 'Status')
      }, {
        field: 'DeploymentType',
        header: 'Deployment Type',
        isSortable: true,
        formatter: this.sharedService.formatDeploymentType,
        titleTooltip: this.sharedService.getTooltip(this.attrDefinitions, 'Deployment Type')
      }, {
        field: 'ApprovalExpirationDate',
        header: 'Approval Expires',
        isSortable: true,
        showColumn: true,
        formatter: this.sharedService.dateFormatter,
        titleTooltip: this.sharedService.getTooltip(this.attrDefinitions, 'Approval Expiration Date')
      }, {
        field: 'Manufacturer',
        header: 'Manufacturer ID',
        isSortable: true,
        showColumn: false,
        titleTooltip: this.sharedService.getTooltip(this.attrDefinitions, 'Manufacturer ID')
      }, {
        field: 'SoftwareProduct',
        header: 'Product ID',
        isSortable: true,
        showColumn: false,
        titleTooltip: this.sharedService.getTooltip(this.attrDefinitions, 'Software Product ID')
      }, {
        field: 'SoftwareProductName',
        header: 'Product',
        isSortable: true,
        showColumn: false,
        titleTooltip: this.sharedService.getTooltip(this.attrDefinitions, 'Software Product Name')
      }, {
        field: 'SoftwareVersion',
        header: 'Version ID',
        isSortable: true,
        showColumn: false,
        titleTooltip: this.sharedService.getTooltip(this.attrDefinitions, 'Software Version ID')
      }, {
        field: 'SoftwareVersionName',
        header: 'Version',
        isSortable: true,
        showColumn: false,
        titleTooltip: this.sharedService.getTooltip(this.attrDefinitions, 'Software Version Name')
      }, {
        field: 'SoftwareRelease',
        header: 'Release ID',
        isSortable: true,
        showColumn: false,
        titleTooltip: this.sharedService.getTooltip(this.attrDefinitions, 'Software Release ID')
      }, {
        field: 'SoftwareReleaseName',
        header: 'Release',
        isSortable: true,
        showColumn: false,
        titleTooltip: this.sharedService.getTooltip(this.attrDefinitions, 'Software Release Name')
      },
       {
        field: 'AlsoKnownAs',
        header: 'Also Known As',
        isSortable: true,
        showColumn: false,
        titleTooltip: this.sharedService.getTooltip(this.attrDefinitions, 'Previously Known As')
      },{
        field: 'StandardType',
        header: 'Standard Type',
        isSortable: true,
        showColumn: false,
        titleTooltip: this.sharedService.getTooltip(this.attrDefinitions, 'Standard Type')
      },{
        field: 'ComplianceStatus',
        header: '508 Compliance',
        isSortable: true,
        showColumn: false,
        titleTooltip: this.sharedService.getTooltip(this.attrDefinitions, '508 Compliance')
      }, {
        field: 'ExceptionLink',
        header: '508 Exception Link',
        isSortable: true,
        showColumn: false,
        titleTooltip: this.sharedService.getTooltip(this.attrDefinitions, '508 Exception Link')
      }, {
        field: 'POC',
        header: 'POC',
        isSortable: true,
        showColumn: false,
        titleTooltip: this.sharedService.getTooltip(this.attrDefinitions, 'POC')
      }, {
        field: 'POCorg',
        header: 'POC Org',
        isSortable: true,
        showColumn: false,
        titleTooltip: this.sharedService.getTooltip(this.attrDefinitions, 'POC Org')
      },
      {
        field: 'Comments',
        header: 'Comments',
        isSortable: true,
        showColumn: false,
        formatter: this.sharedService.formatDescription,
        titleTooltip: this.sharedService.getTooltip(this.attrDefinitions, 'Comments')
      }, {
        field: 'fedramp',
        header: 'FedRAMP',
        isSortable: true,
        showColumn: false,
        formatter: this.YesNo,
        titleTooltip: this.sharedService.getTooltip(this.attrDefinitions, 'FedRAMP')
      }, {
        field: 'open_source',
        header: 'Open Source',
        isSortable: true,
        showColumn: false,
        formatter: this.YesNo,
        titleTooltip: this.sharedService.getTooltip(this.attrDefinitions, 'Open Source')
      },{
        field: 'RITM',
        header: 'Requested Item (RITM)',
        isSortable: true,
        showColumn: false,
        titleTooltip: this.sharedService.getTooltip(this.attrDefinitions, 'Requested Item (RITM)')
      }, {
        field: 'OperatingSystems',
        header: 'Operating Systems',
        isSortable: false,
        showColumn: false,
        formatter: this.sharedService.csvFormatter,
        titleTooltip: this.sharedService.getTooltip(this.attrDefinitions, 'Operating Systems')
      },
      {
        field: 'AppBundleIds',
        header: 'App Bundle Ids',
        isSortable: false,
        showColumn: false,
        formatter: this.sharedService.csvFormatter,
        titleTooltip: this.sharedService.getTooltip(this.attrDefinitions, 'App Bundle Ids')
      },
      {
        field: 'ConditionsRestrictions',
        header: 'Conditions/Restrictions',
        isSortable: false,
        showColumn: false,
        titleTooltip: this.sharedService.getTooltip(this.attrDefinitions, 'ConditionsRestrictions')
      }, {
        field: 'CriticalReview',
        header: 'Critical Software Review Results',
        isSortable: true,
        showColumn: false,
        titleTooltip: this.sharedService.getTooltip(this.attrDefinitions, 'Critical Software Review Results')
      }, {
        field: 'CSCRMReview',
        header: 'C-SCRM Review Results',
        isSortable: true,
        showColumn: false,
        hideFromPicker: true,
        titleTooltip: this.sharedService.getTooltip(this.attrDefinitions, 'C-SCRM Review Results')
      }];

      // Initial load: first page, using whatever tab/chip/date-filter state
      // was parsed from the route above.
      this.loadPage({
        page: 1,
        pageSize: this.currentPageSize,
        sortField: this.currentSortField,
        sortOrder: this.currentSortOrder,
        search: this.currentSearch,
      });
      this.refreshTotals();
    });
  }

  ngOnDestroy(): void {
    this.queryParamsSubscription?.unsubscribe();
  }

  public onRowClick(e: any) {
    const searchTerm: string = e.tableSearchString || '';
    this.router.navigate(['/it_standards', e.ID], {
        queryParams: { tableSearchTerm: searchTerm }
    });
  }

  private setCondtionStatus(itStandards: ITStandards[]): ITStandards[] {
    itStandards.forEach(i => {
      if (i.ConditionsRestrictions && i.ConditionsRestrictions.length > 0) {
        i.Status = 'Approved with conditions';
      }
    });
    return itStandards;
  }
}
