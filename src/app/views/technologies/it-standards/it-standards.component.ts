import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';

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
export class ItStandardsComponent implements OnInit {

  private readonly otherStatuses: string[] = ['Approved', 'Denied', 'Retired'];

  // row: Object = <any>{};
  // filteredTable: boolean = false;
  // filterTitle: string = '';
  attrDefinitions: DataDictionary[] = [];
  // columnDefs: any[] = [];
  // dataReady: boolean = false;

  public tableCols: Column[] = [];
  public selectedTab: string = 'All';
  public filterTotals: any = null;
  public itStandardsData: ITStandards[] = [];
  public itStandardsDataTabFilterted: ITStandards[] = [];
  public itStandardsDataChipFilterted: ITStandards[] = [];
  public filterChips: string[] = ['Mobile', 'Desktop', 'Server', 'SaaS', 'PaaS', 'Other'];
  private selectedChips: string[] = [];

  public daysExpiring: number = 0;
  public daysRetired: number = 0;
  public includePastDueExpirations: boolean = false;
  public pastDueOnly: boolean = false;

  public isDataReady: boolean = false;

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
    this.itStandardsDataTabFilterted = this.itStandardsData;

    if(this.selectedTab === 'All') {
      if(this.hasSelectedChips()) {
        this.onFilterChipSelect(this.selectedChips);
      } else {
        this.tableService.updateReportTableData(this.itStandardsDataTabFilterted);
        //this.tableService.updateReportTableDataReadyStatus(true);
      }
    } else if (this.selectedTab === 'Other') {
      if(this.hasSelectedChips()) {
        this.itStandardsDataTabFilterted = this.itStandardsDataTabFilterted.filter(x => {
          return x.Status !== 'Approved' && x.Status !== 'Denied' && x.Status !== 'Retired';
        });
        this.onFilterChipSelect(this.selectedChips);
      } else {
        this.itStandardsDataTabFilterted = this.itStandardsDataTabFilterted.filter(x => {
          return x.Status !== 'Approved' && x.Status !== 'Denied' && x.Status !== 'Retired' && x.Status !== 'Approved with conditions';
        });
        this.tableService.updateReportTableData(this.itStandardsDataTabFilterted);
        //this.tableService.updateReportTableDataReadyStatus(true);
      }
    } else {
      if(this.hasSelectedChips()) {
        this.itStandardsDataTabFilterted = this.itStandardsDataTabFilterted.filter(x => {
          return x.Status === tabName;
        });
        this.onFilterChipSelect(this.selectedChips);
      } else {
        this.itStandardsDataTabFilterted = this.itStandardsDataTabFilterted.filter(x => {
          return x.Status === tabName;
        });
        this.tableService.updateReportTableData(this.itStandardsDataTabFilterted);
        //this.tableService.updateReportTableDataReadyStatus(true);
      }
    }
  }

  public onKeyUp(e: KeyboardEvent, tabName: string) {
    if(e.key === ' ' || e.key === 'Enter') {
      this.onSelectTab(tabName);
    }
  }

  public onFilterChipSelect(selectedChips: string[]): void {
    this.selectedChips = selectedChips;
    this.syncUrlToFilters();
    this.itStandardsDataChipFilterted = this.itStandardsDataTabFilterted;
    if(this.hasSelectedChips()) {
      this.itStandardsDataChipFilterted = this.itStandardsDataTabFilterted.filter(f => {
        return selectedChips.includes(f.DeploymentType);
      });
      this.tableService.updateReportTableData(this.itStandardsDataChipFilterted);
      this.tableService.updateReportTableDataReadyStatus(true);
    } else {
      this.itStandardsDataChipFilterted = this.itStandardsDataTabFilterted;
      this.onSelectTab(this.selectedTab);
    }
    this.updateTotals();
  }

  public isTabSelected(tabName: string): boolean {
    return this.selectedTab === tabName;
  }

  private hasSelectedChips(): boolean {
    return this.selectedChips && this.selectedChips.length > 0;
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
    return value === 'T'? "Yes" : "No";
  }

  private updateTotals(): void {
    const filteredData = this.hasSelectedChips()
      ? this.itStandardsData.filter(standard => this.selectedChips.includes(standard.DeploymentType))
      : this.itStandardsData;

    let approvedTotal = 0, deniedTotal = 0, retiredTotal = 0, otherTotal = 0;
    for (const standard of filteredData) {
      if (standard.Status === 'Approved') { approvedTotal++; }
      else if (standard.Status === 'Denied') { deniedTotal++; }
      else if (standard.Status === 'Retired') { retiredTotal++; }
      else { otherTotal++; }
    }

    this.filterTotals = {
      ApprovedTotal: approvedTotal,
      DeniedTotal: deniedTotal,
      RetiredTotal: retiredTotal,
      OtherTotal: otherTotal,
      AllTotal: filteredData.length,
    };
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

   this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        this.selectedTab = params['tab'];
      }
      if(params['expiringWithinDays']) {
        this.daysExpiring = +params['expiringWithinDays'];
      }
      if (params['includePastDue']) {
        this.includePastDueExpirations = params['includePastDue'] === 'true';
      }
      if (params['pastDueOnly']) {
        this.pastDueOnly = params['pastDueOnly'] === 'true';
      }
      if(params['retiredWithinDays']) {
        this.daysRetired = +params['retiredWithinDays'];
      }
    });
    
    forkJoin({
      defs: this.apiService.getDataDictionaryByReportName('IT Standards List'),
      standards: this.apiService.getITStandards(),
    }).subscribe(({ defs, standards }) => {
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
      //  {
      //   field: 'EndOfLifeDate',
      //   header: 'Vendor End of Life Date',
      //   isSortable: true,
      //   showColumn: false,
      //   formatter: this.sharedService.dateFormatter,
      //  titleTooltip: this.sharedService.getTooltip(this.attrDefinitions, 'Software End of Life Date')
      // },
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
      }, /*{
        field: 'attestation_required',
        header: 'Attestation Required',
        isSortable: true,
        showColumn: false,
        titleTooltip: this.sharedService.getTooltip(this.attrDefinitions, 'Attestation Required')
      }, {
        field: 'attestation_link',
        header: 'Attestation Link',
        isSortable: true,
        showColumn: false,
        titleTooltip: this.sharedService.getTooltip(this.attrDefinitions, 'Attestation Link')
      }, */{
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

      // Set JWT when logged into GEAR Manager when returning from secureAuth
      this.sharedService.setJWTonLogIn();

      const i = standards;
      const standardsWithConditionStatus = this.setCondtionStatus(i);
      this.itStandardsData = standardsWithConditionStatus;
      this.itStandardsDataTabFilterted = standardsWithConditionStatus;
      this.itStandardsDataChipFilterted = standardsWithConditionStatus;
      this.updateTotals();

      const queryParams = this.route.snapshot.queryParams;
      const daysExpiring = Number(queryParams['expiringWithinDays'] || this.daysExpiring || 0);
      const daysRetired = Number(queryParams['retiredWithinDays'] || this.daysRetired || 0);
      const includePastDue = queryParams['includePastDue'] === 'true' || this.includePastDueExpirations;
      const pastDueOnly = queryParams['pastDueOnly'] === 'true' || this.pastDueOnly;

      if(daysExpiring > 0) {
        const now = new Date(); // Current date and time
        now.setHours(0, 0, 0, 0);
        const expiringWithin = new Date();
        expiringWithin.setDate(now.getDate() + daysExpiring); // number of days set in the url
        expiringWithin.setHours(0, 0, 0, 0);
        const expiringFiltered: ITStandards[] = [];
        i.forEach(x => {
          let renewal = new Date(x.ApprovalExpirationDate);
          renewal.setHours(0, 0, 0, 0);
          const isInWindow = includePastDue
            ? renewal <= expiringWithin
            : (renewal >= now && renewal <= expiringWithin);
          if(x.ApprovalExpirationDate && isInWindow && this.isInExpiringStatusScope(x)) {
            expiringFiltered.push(x);
          }
        });
        this.tableService.updateReportTableData(expiringFiltered);
        this.tableService.updateReportTableDataReadyStatus(true);
      } else if (pastDueOnly) {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const pastDueFiltered: ITStandards[] = [];
        i.forEach(x => {
          let renewal = new Date(x.ApprovalExpirationDate);
          renewal.setHours(0, 0, 0, 0);
          if (x.ApprovalExpirationDate && renewal < now && this.isInExpiringStatusScope(x)) {
            pastDueFiltered.push(x);
          }
        });
        this.tableService.updateReportTableData(pastDueFiltered);
        this.tableService.updateReportTableDataReadyStatus(true);
      } else if(daysRetired > 0) {
        const now = new Date(); // Current date and time
        now.setHours(0, 0, 0, 0);
        const expiredWithin = new Date();
        expiredWithin.setDate(now.getDate() - daysRetired); // number of days set in the url
        expiredWithin.setHours(0, 0, 0, 0);
        const expiringFiltered: ITStandards[] = [];
        i.forEach(x => {
          let renewal = new Date(x.ApprovalExpirationDate);
          renewal.setHours(0, 0, 0, 0);
          if(x.ApprovalExpirationDate && (renewal <= now && renewal >= expiredWithin) && (x.Status === 'Retired')) {
            expiringFiltered.push(x);
          }
        });
        this.tableService.updateReportTableData(expiringFiltered);
        this.tableService.updateReportTableDataReadyStatus(true);
      } else {
        this.tableService.updateReportTableData(i);
        this.tableService.updateReportTableDataReadyStatus(true);
      }

      // this.tableService.updateReportTableData(i);
      
      if (this.selectedTab !== 'All') {
        this.onSelectTab(this.selectedTab);
      }
    }); // end forkJoin

  //   // Method to open details modal when referenced directly via URL
  //   this.route.params.subscribe((params) => {
  //     let detailStandID = params['standardID'];
  //     let deploymentType = params['deploymentType'];
  //     let status = params['status'];

  //     if(deploymentType) {
  //       let filterButton = {
  //         buttonText: deploymentType[0].toUpperCase() + deploymentType.slice(1),
  //         filters: [
  //           { field: 'DeploymentType', value: deploymentType.toLocaleLowerCase() }
  //         ]
  //       };
  //       this.preloadedFilterButtons.push(filterButton);
  //     }

  //     if(status) {
  //       let filterButton = {
  //         buttonText: status[0].toUpperCase() + status.slice(1),
  //         filters: [
  //           { field: 'Status', value: status.toLocaleLowerCase() }
  //         ]
  //       };
  //       this.preloadedFilterButtons.push(filterButton);
  //     }

  //     if (detailStandID) {
  //       this.titleService.setTitle(
  //         `${this.titleService.getTitle()} - ${detailStandID}`
  //       );
  //       this.apiService
  //         .getOneITStandard(detailStandID)
  //         .subscribe((data: any[]) => {
  //           this.tableService.itStandTableClick(data[0]);
  //         });
  //     }
  //   });
  }

  // // Create new IT Standard when in GEAR Manager mode
  // createITStand() {
  //   var emptyITStand = new ITStandards();

  //   // By default, set new record status to "Pilot"
  //   emptyITStand.Status = 'Pilot';
  //   this.modalService.updateRecordCreation(true);
  //   this.sharedService.setITStandardsForm();
  //   this.modalService.updateDetails(emptyITStand, 'it-standard', false);
  //   $('#itStandardsManager').modal('show');

  //   // disable the tcSoftwareProduct on the itStandardsManager modal
  //   $('#divProduct').addClass("disabledDivProduct");
  //   $('#divVersion').addClass("disabledDivVersion");
  //   $('#divRelease').addClass("disabledDivRelease");
  // }

  // getTooltip (name: string): string {
  //   const def = this.attrDefinitions.find(def => def.Term === name);
  //   if(def){
  //     return def.TermDefinition;
  //   }
  //   return '';
  // }

  public onRowClick(e: any) {
    const searchTerm: string = e.tableSearchString || '';
    this.router.navigate(['/it_standards', e.ID], {
        queryParams: { tableSearchTerm: searchTerm }
    });
  }

  // onFilterClick(filterButtons: FilterButton[]) {
  //   this.tableData = this.tableDataOriginal;
  //   this.tableService.filterButtonClick(filterButtons, this.tableData);
  // }

  // onFilterResetClick() {
  //   this.tableData = this.tableDataOriginal;
  //   this.tableService.updateReportTableData(this.tableDataOriginal);
  // }

  private setCondtionStatus(itStandards: ITStandards[]): ITStandards[] {
    itStandards.forEach(i => {
      if(i.ConditionsRestrictions && i.ConditionsRestrictions.length > 0) {
        i.Status = 'Approved with conditions';
      }
    });
    return itStandards;
  }

  // Keep dashboard deep-link filters consistent with backend totals query scope.
  private isInExpiringStatusScope(standard: ITStandards): boolean {
    const approvedLikeStatusIds = [11, 2, 6, 9];

    if (typeof standard.StatusId === 'number') {
      return approvedLikeStatusIds.includes(standard.StatusId);
    }

    return standard.Status === 'Approved'
      || standard.Status === 'Approved with conditions'
      || standard.Status === 'Pilot'
      || standard.Status === 'Exception'
      || standard.Status === 'Sunsetting';
  }
}
