import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ApiService } from '@services/apis/api.service';
import { ModalsService } from '@services/modals/modals.service';
import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';
import { Title } from '@angular/platform-browser';

import { ITStandards } from '@api/models/it-standards.model';
import { DataDictionary } from '@api/models/data-dictionary.model';
import { take } from 'rxjs/operators';
import { HttpParams } from '@angular/common/http';
import { FilterButton, Column, TwoDimArray } from '@common/table-classes';
import { timeHours } from 'd3';

// Declare jQuery symbol
// declare var $: any;

@Component({
    selector: 'it-standards',
    templateUrl: './it-standards.component.html',
    styleUrls: ['./it-standards.component.scss'],
    standalone: false
})
export class ItStandardsComponent implements OnInit {
  // row: Object = <any>{};
  // filteredTable: boolean = false;
  // filterTitle: string = '';
  attrDefinitions: DataDictionary[] = [];
  // columnDefs: any[] = [];
  // dataReady: boolean = false;

  public defExpanded: boolean = false;
  public tableCols: Column[] = [];
  public selectedTab: string = 'All';
  public filterTotals: any = null;
  public itStandardsData: ITStandards[] = [];
  public itStandardsDataTabFilterted: ITStandards[] = [];
  public itStandardsDataChipFilterted: ITStandards[] = [];
  public filterChips: string[] = ['Mobile', 'Desktop', 'Server', 'SaaS', 'PaaS', 'Other'];
  private selectedChips: string[] = [];

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

  public onViewAll(): void {
    this.defExpanded = !this.defExpanded;
  }

  public onSelectTab(tabName: string): void {
    this.selectedTab = tabName;
    this.itStandardsDataTabFilterted = this.itStandardsData;

    if(this.selectedTab === 'All') {
      if(this.hasSelectedChips()) {
        this.onFilterChipSelect(this.selectedChips);
      } else {
        this.tableService.updateReportTableData(this.itStandardsDataTabFilterted);
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
      }
    }
  }

  public onFilterChipSelect(selectedChips: string[]): void {
    this.selectedChips = selectedChips;
    this.itStandardsDataChipFilterted = this.itStandardsDataTabFilterted;
    if(this.hasSelectedChips()) {
      this.itStandardsDataChipFilterted = this.itStandardsDataTabFilterted.filter(f => {
        return selectedChips.includes(f.DeploymentType);
      });
      this.tableService.updateReportTableData(this.itStandardsDataChipFilterted);
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

  private YesNo(value, row, index, field): string {
    return value === 'T'? "Yes" : "No";
  }

  private updateTotals(): void {
    this.apiService.getITStandardsFilterTotals(this.selectedChips).subscribe(t => {
      this.filterTotals = t;
    })
  }

  ngOnInit(): void {
    /*
    * Get definitions for the table header tooltips
    * Then set the column defintions and initialize the table
    */
   this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        this.selectedTab = params['tab'];
      }
    });
    this.apiService.getDataDictionaryByReportName('IT Standards List').subscribe(defs => {
      this.attrDefinitions = defs

      // IT Standard Table Columns
      this.tableCols = [{
        field: 'ID',
        header: 'ID',
        isSortable: true,
        showColumn: false,
        titleTooltip: this.getTooltip('ID')
      }, {
        field: 'Name',
        header: 'IT Standard Name',
        isSortable: true,
        showColumn: true,
        titleTooltip: this.getTooltip('IT Standard Name')
      },
      {
        field: 'ApprovedVersions',
        header: 'Approved Versions',
        isSortable: false,
        showColumn: true,
        titleTooltip: this.getTooltip('Approved Versions')
      }, {
        field: 'Manufacturer',
        header: 'Manufacturer ID',
        isSortable: true,
        showColumn: false,
        titleTooltip: this.getTooltip('Manufacturer ID')
      }, {
        field: 'ManufacturerName',
        header: 'Manufacturer',
        isSortable: true,
        titleTooltip: this.getTooltip('Manufacturer Name')
      }, {
        field: 'SoftwareProduct',
        header: 'Product ID',
        isSortable: true,
        showColumn: false,
        titleTooltip: this.getTooltip('Software Product ID')
      }, {
        field: 'SoftwareProductName',
        header: 'Product',
        isSortable: true,
        showColumn: false,
        titleTooltip: this.getTooltip('Software Product Name')
      }, {
        field: 'SoftwareVersion',
        header: 'Version ID',
        isSortable: true,
        showColumn: false,
        titleTooltip: this.getTooltip('Software Version ID')
      }, {
        field: 'SoftwareVersionName',
        header: 'Version',
        isSortable: true,
        showColumn: false,
        titleTooltip: this.getTooltip('Software Version Name')
      }, {
        field: 'SoftwareRelease',
        header: 'Release ID',
        isSortable: true,
        showColumn: false,
        titleTooltip: this.getTooltip('Software Release ID')
      }, {
        field: 'SoftwareReleaseName',
        header: 'Release',
        isSortable: true,
        showColumn: false,
        titleTooltip: this.getTooltip('Software Release Name')
      }, {
        field: 'EndOfLifeDate',
        header: 'Vendor End of Life Date',
        isSortable: true,
        showColumn: false,
        formatter: this.sharedService.dateFormatter,
       titleTooltip: this.getTooltip('Software End of Life Date')
      }, {
        field: 'OldName',
        header: 'Also Known As',
        isSortable: true,
        showColumn: false,
        titleTooltip: this.getTooltip('Previously Known As')
      }, {
        field: 'Description',
        header: 'Description',
        isSortable: true,
        showColumn: true,
        formatter: this.sharedService.formatDescriptionLite,
        titleTooltip: this.getTooltip('Description')
      }, {
        field: 'Category',
        header: 'Category',
        isSortable: true,
        titleTooltip: this.getTooltip('Category')
      }, {
        field: 'Status',
        header: 'Status',
        isSortable: true,
        formatter: this.sharedService.formatStatus,
        titleTooltip: this.getTooltip('Status')
      }, {
        field: 'StandardType',
        header: 'Standard Type',
        isSortable: true,
        showColumn: false,
        titleTooltip: this.getTooltip('Standard Type')
      }, {
        field: 'DeploymentType',
        header: 'Deployment Type',
        isSortable: true,
        formatter: this.sharedService.formatDeploymentType,
        titleTooltip: this.getTooltip('Deployment Type')
      }, {
        field: 'ComplianceStatus',
        header: '508 Compliance',
        isSortable: true,
        showColumn: false,
        titleTooltip: this.getTooltip('508 Compliance')
      }, {
        field: 'POC',
        header: 'POC',
        isSortable: true,
        showColumn: false,
        titleTooltip: this.getTooltip('POC')
      }, {
        field: 'POCorg',
        header: 'POC Org',
        isSortable: true,
        showColumn: false,
        titleTooltip: this.getTooltip('POC Org')
      },
      {
        field: 'Comments',
        header: 'Comments',
        isSortable: true,
        showColumn: false,
        formatter: this.sharedService.formatDescription,
        titleTooltip: this.getTooltip('Comments')
      }, {
        field: 'attestation_required',
        header: 'Attestation Required',
        isSortable: true,
        showColumn: false,
        titleTooltip: this.getTooltip('Attestation Required')
      }, {
        field: 'attestation_link',
        header: 'Attestation Link',
        isSortable: true,
        showColumn: false,
        titleTooltip: this.getTooltip('Attestation Link')
      }, {
        field: 'fedramp',
        header: 'FedRAMP',
        isSortable: true,
        showColumn: false,
        formatter: this.YesNo,
        titleTooltip: this.getTooltip('FedRAMP')
      }, {
        field: 'open_source',
        header: 'Open Source',
        isSortable: true,
        showColumn: false,
        formatter: this.YesNo,
        titleTooltip: this.getTooltip('Open Source')
      },{
        field: 'RITM',
        header: 'Requested Item (RITM)',
        isSortable: true,
        showColumn: false,
        titleTooltip: this.getTooltip('Requested Item (RITM)')
      }, {
        field: 'ApprovalExpirationDate',
        header: 'Approval Expires',
        isSortable: true,
        showColumn: true,
        formatter: this.sharedService.dateFormatter,
        titleTooltip: this.getTooltip('Approval Expiration Date')
      },
      {
        field: 'OperatingSystems',
        header: 'Operating Systems',
        isSortable: false,
        showColumn: false,
        formatter: this.sharedService.csvFormatter,
        titleTooltip: this.getTooltip('Operating Systems')
      },
      {
        field: 'AppBundleIds',
        header: 'App Bundle Ids',
        isSortable: false,
        showColumn: false,
        formatter: this.sharedService.csvFormatter,
        titleTooltip: this.getTooltip('App Bundle Ids')
      }];
    });

  //   // Set JWT when logged into GEAR Manager when returning from secureAuth
  //   this.sharedService.setJWTonLogIn();

  this.apiService.getITStandards().subscribe(i => {
      this.itStandardsData = i;
      this.itStandardsDataTabFilterted = i;
      this.itStandardsDataChipFilterted = i;
      this.tableService.updateReportTableData(i);
      
      if (this.selectedTab !== 'All') {
        this.onSelectTab(this.selectedTab);
      }
    });

    this.apiService.getITStandardsFilterTotals(this.selectedChips).subscribe(t => {
      this.filterTotals = t;
    });

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

  getTooltip (name: string): string {
    const def = this.attrDefinitions.find(def => def.Term === name);
    if(def){
      return def.TermDefinition;
    }
    return '';
  }

  public onRowClick(e: any) {
    this.router.navigate(['it_standards', e.ID]);
  }

  // onFilterClick(filterButtons: FilterButton[]) {
  //   this.tableData = this.tableDataOriginal;
  //   this.tableService.filterButtonClick(filterButtons, this.tableData);
  // }

  // onFilterResetClick() {
  //   this.tableData = this.tableDataOriginal;
  //   this.tableService.updateReportTableData(this.tableDataOriginal);
  // }
}
