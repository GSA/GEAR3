import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { ApiService } from '@services/apis/api.service';
import { ModalsService } from '@services/modals/modals.service';
import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';
import { Title } from '@angular/platform-browser';

import { System } from '@api/models/systems.model';
import { Column, FilterButton, TwoDimArray } from '../../../common/table-classes';
import { DataDictionary } from '@api/models/data-dictionary.model';

// Declare D3 & Sankey library
// declare var d3: any;
// import * as d3Sankey from 'd3-sankey';

// // Declare jQuery symbol
// declare var $: any;

@Component({
    selector: 'systems',
    templateUrl: './systems.component.html',
    styleUrls: ['./systems.component.scss'],
    standalone: false
})
export class SystemsComponent implements OnInit {
  // row: Object = <any>{};
  filteredTable: boolean = false;
  filterTitle: string = '';
  // interfaces: any[] = [];
  // cloudTable: boolean = false;
  // inactiveTable: boolean = false;
  // pendingTable: boolean = false;

  vizData: any[] = [];
  vizLabel: string = 'Total Active Systems';
  colorScheme: {} = {
    domain: ['#5AA454', '#E44D25', '#CFC0BB', '#7aa3e5', '#a8385d', '#aae3f5'],
  };

  public tableCols: Column[] = [];
  public selectedTab: string = '';
  public filterTotals: any = null;

  public systemsData: System[] = [];
  public systemsDataTabFilterted: System[] = [];

  // custom filter queryParams values
  public monthsDecommissioned: number = 0;
  public cloudBasedFilterValue = null;
  public cspName: string = '';

  public attributeDefs: DataDictionary[] = [];
  public  defaultTableCols: Column[] = [];
  public inactiveColumnDefs: Column[] = [];

  constructor(
    private apiService: ApiService,
    private location: Location,
    private modalService: ModalsService,
    private route: ActivatedRoute,
    private router: Router,
    public sharedService: SharedService,
    private tableService: TableService,
    private titleService: Title
  ) {
    // this.modalService.currentSys.subscribe((row) => (this.row = row));
  }

  public onSelectTab(tabName: string): void {
    this.selectedTab = tabName;
    this.systemsDataTabFilterted = [];

    if(this.selectedTab === 'All') {
      this.systemsDataTabFilterted = this.systemsData.filter(s => {
        return s.Status === 'Active' && s.BusApp === 'Yes';
      });
      this.tableCols = this.defaultTableCols;
    } else if (this.selectedTab === 'Cloud Enabled') {
      this.systemsDataTabFilterted = this.systemsData.filter(s => {
        return s.Status === 'Active' && s.BusApp === 'Yes' && s.CloudYN === 'Yes';
      });
      this.tableCols = this.defaultTableCols;
    } else if (this.selectedTab === 'Inactive') {
      this.systemsDataTabFilterted = this.systemsData.filter(s => {
        return s.Status === 'Inactive' && s.BusApp === 'Yes';
      });
      this.tableCols = this.inactiveColumnDefs;
    }
    this.tableService.updateReportTableData(this.systemsDataTabFilterted);
    this.tableService.updateReportTableDataReadyStatus(true);
  }

  public onKeyUp(e: KeyboardEvent, tabName: string) {
    if(e.key === ' ' || e.key === 'Enter') {
      this.onSelectTab(tabName);
    }
  }

  public isTabSelected(tabName: string): boolean {
    return this.selectedTab === tabName;
  }

  ngOnInit(): void {
    // // Set JWT when logged into GEAR Manager when returning from secureAuth
    this.sharedService.setJWTonLogIn();

    // Check for tab parameter in route
    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        this.selectedTab = params['tab'];
      }
      if(params['decommissionedWithinMonths']) {
        this.monthsDecommissioned = +params['decommissionedWithinMonths'];
      }
      if(params['cloudBased']) {
        this.cloudBasedFilterValue = params['cloudBased'];
      }
      if(params['systemCSP']) {
        this.cspName = params['systemCSP'];
      }
    });

    this.apiService.getDataDictionaryByReportName('Business Systems').subscribe(defs => {
      this.attributeDefs = defs;

      this.defaultTableCols = [
        {
          field: 'ID',
          header: 'ID',
          isSortable: true,
          showColumn: false,
          titleTooltip: this.getTooltip('ID')
        },
        {
          field: 'DisplayName',
          header: 'Alias / Acronym',
          isSortable: true,
          titleTooltip: this.getTooltip('Alias/Acronym')
        },
        {
          field: 'Name',
          header: 'System Name',
          isSortable: true,
          titleTooltip: this.getTooltip('System Name')
        },
        {
          field: 'Description',
          header: 'Description',
          isSortable: true,
          showColumn: true,
          formatter: this.sharedService.formatDescriptionShorter,
          titleTooltip: this.getTooltip('Description')
        },
        {
          field: 'SystemLevel',
          header: 'System Level',
          isSortable: true,
          titleTooltip: this.getTooltip('System Level')
        },
        {
          field: 'Status',
          header: 'Status',
          isSortable: true,
          titleTooltip: this.getTooltip('Status')
        },
        {
          field: 'RespOrg',
          header: 'Responsible Org',
          isSortable: true,
          titleTooltip: this.getTooltip('Responsible IT Org')
        },
        {
          field: 'BusOrgSymbolAndName',
          header: 'SSO/CXO',
          isSortable: true,
          titleTooltip: this.getTooltip('SSO/CXO')
        },
        {
          field: 'BusOrg',
          header: 'Business Org',
          isSortable: true,
          titleTooltip: this.getTooltip('Business Org')
        },
        {
          field: 'ParentName',
          header: 'Parent System',
          isSortable: true,
          showColumn: false,
          titleTooltip: this.getTooltip('Parent System')
        },
        {
          field: 'CSP',
          header: 'Hosting Provider',
          isSortable: true,
          showColumn: false,
          titleTooltip: this.getTooltip('Hosting Provider')
        },
        {
          field: 'CloudYN',
          header: 'Cloud Hosted?',
          isSortable: true,
          showColumn: false,
          titleTooltip: this.getTooltip('Cloud Hosted?')
        },
        {
          field: 'ServiceType',
          header: 'Cloud Service Type',
          isSortable: true,
          showColumn: false,
          titleTooltip: this.getTooltip('Cloud Service Type')
        },
        {
          field: 'AO',
          header: 'Authorizing Official',
          isSortable: true,
          showColumn: false,
          formatter: this.sharedService.pocStringNameFormatter,
          titleTooltip: this.getTooltip('Authorizing Official')
        },
        {
          field: 'SO',
          header: 'System Owner',
          isSortable: true,
          showColumn: false,
          formatter: this.sharedService.pocStringNameFormatter,
          titleTooltip: this.getTooltip('System Owner')
        },
        {
          field: 'BusPOC',
          header: 'Business POC',
          isSortable: true,
          showColumn: false,
          formatter: this.sharedService.pocStringNameFormatter,
          titleTooltip: this.getTooltip('Business POC')
        },
        {
          field: 'TechPOC',
          header: 'Technical POC',
          isSortable: true,
          showColumn: false,
          formatter: this.sharedService.pocStringNameFormatter,
          titleTooltip: this.getTooltip('Technical POC')
        },
        {
          field: 'DataSteward',
          header: 'Data Steward',
          isSortable: true,
          showColumn: false,
          formatter: this.sharedService.pocStringNameFormatter,
          titleTooltip: this.getTooltip('Data Steward')
        },
        {
          field: 'FISMASystemIdentifier',
          header: 'FISMA System Identifier',
          isSortable: true,
          showColumn: false,
          titleTooltip: this.getTooltip('FISMA System Identifier')
        },
      ];
    
      // Inactive Column Defs
      this.inactiveColumnDefs = [
        {
          field: 'Name',
          header: 'System Name',
          isSortable: true,
          titleTooltip: this.getTooltip('System Name')
        },
        {
          field: 'Description',
          header: 'Description',
          isSortable: true,
          showColumn: true,
          formatter: this.sharedService.formatDescription,
          titleTooltip: this.getTooltip('Description')
        },
        {
          field: 'SystemLevel',
          header: 'System Level',
          isSortable: true,
          titleTooltip: this.getTooltip('System Level')
        },
        {
          field: 'Status',
          header: 'Status',
          isSortable: true,
          titleTooltip: this.getTooltip('Status')
        },
        {
          field: 'RespOrg',
          header: 'Responsible Org',
          isSortable: true,
          titleTooltip: this.getTooltip('Responsible IT Org')
        },
        {
          field: 'BusOrg',
          header: 'Business Org',
          isSortable: true,
          titleTooltip: this.getTooltip('Business Org')
        },
        {
          field: 'CSP',
          header: 'Cloud Server Provider',
          isSortable: true,
          showColumn: false,
          titleTooltip: this.getTooltip('Hosting Provider')
        },
        {
          field: 'CloudYN',
          header: 'Cloud Hosted?',
          isSortable: true,
          showColumn: false,
          titleTooltip: this.getTooltip('	Cloud Hosted?')
        },
        {
          field: 'AO',
          header: 'Authorizing Official',
          isSortable: true,
          showColumn: false,
          formatter: this.sharedService.pocStringNameFormatter,
          titleTooltip: this.getTooltip('	Authorizing Official')
        },
        {
          field: 'SO',
          header: 'System Owner',
          isSortable: true,
          showColumn: false,
          formatter: this.sharedService.pocStringNameFormatter,
          titleTooltip: this.getTooltip('System Owner')
        },
        {
          field: 'InactiveDate',
          header: 'Inactive Date',
          isSortable: true,
          formatter: this.sharedService.dateFormatter,
          titleTooltip: this.getTooltip('Inactive Date')
        },
      ];
    });

    this.apiService.getSystems().subscribe(systems => {
      this.systemsData = systems;

      if(this.monthsDecommissioned > 0) {
        const now = new Date(); // Current date and time
        now.setUTCHours(0, 0, 0, 0);
        const decommWithin = new Date();
        decommWithin.setMonth(now.getMonth() - this.monthsDecommissioned); // number of months set in the url
        decommWithin.setUTCHours(0, 0, 0, 0);
        const expiringFiltered = [];
        systems.forEach(s => {
          let expDate = new Date(s.InactiveDate);
          if(s.InactiveDate && (expDate <= now && expDate >= decommWithin) && (s.Status === 'Inactive' && s.BusApp === 'Yes')) {
            expiringFiltered.push(s);
          }
        });
        this.tableCols = this.defaultTableCols;
        this.tableService.updateReportTableData(expiringFiltered);
        this.tableService.updateReportTableDataReadyStatus(true);
      } else if (this.cloudBasedFilterValue) {
        const notCloudBasedFiltered = [];
        systems.forEach(s => {
          if(s.CloudYN){ 
            if((s.CloudYN.toLocaleLowerCase() === this.cloudBasedFilterValue.toLocaleLowerCase()) && s.Status == 'Active' && s.BusApp == 'Yes') {
              notCloudBasedFiltered.push(s);
            }
          }
        });
        this.tableCols = this.defaultTableCols;
        this.tableService.updateReportTableData(notCloudBasedFiltered);
        this.tableService.updateReportTableDataReadyStatus(true);
      } else if (this.cspName) {
        const cspFiltered = [];
        systems.forEach(s => {
          if(s.CSP) {
            if(this.cspName.toLocaleLowerCase() === 'aws') {
              if((s.CSP.toLocaleLowerCase() === 'aws (govcloud)' ||
                 s.CSP.toLocaleLowerCase() === 'aws' ||
                 s.CSP.toLocaleLowerCase() === 'fedramp aws east/west') &&
                 s.Status == 'Active' && s.BusApp == 'Yes') {
                cspFiltered.push(s);
              }
            } else if(s.CSP.toLocaleLowerCase() === this.cspName.toLocaleLowerCase() && s.Status == 'Active' && s.BusApp == 'Yes') {
              cspFiltered.push(s);
            }
          }
        });
        this.tableCols = this.defaultTableCols;
        this.tableService.updateReportTableData(cspFiltered);
        this.tableService.updateReportTableDataReadyStatus(true);
      } else { 
        // Apply tab filter based on selectedTab
        this.selectedTab = 'All';
        this.onSelectTab(this.selectedTab);
      }
    });

    this.apiService.getSystemsFilterTotals().subscribe(t => {
      this.filterTotals = t;
    });

    // Get System data for visuals
    this.apiService.getSystems().subscribe((data: any[]) => {
      // Get counts by SSO
      var counts = data.reduce((p, c) => {
        var name = c.BusOrgSymbolAndName;
        if (
          !p.hasOwnProperty(name) &&
          c.Status == 'Active' &&
          c.BusApp == 'Yes'
        ) {
          p[name] = 0;
        }
        // Only count if Status is Active
        if (c.Status == 'Active' && c.BusApp == 'Yes') p[name]++;
        return p;
      }, {});

      // Resolve the counts into an object and sort by value
      this.vizData = Object.keys(counts)
        .map((k) => {
          return { name: k, value: counts[k] };
        })
        .sort(function (a, b) {
          return b.value - a.value;
        });

      // console.log(this.vizData);  // Debug
    });



    // // Method to open details modal when referenced directly via URL
    // this.route.params.subscribe((params) => {
    //   var detailSysID = params['sysID'];
    //   if (detailSysID) {
    //     this.titleService.setTitle(
    //       `${this.titleService.getTitle()} - ${detailSysID}`
    //     );
    //     this.apiService.getOneSys(detailSysID).subscribe((data: any[]) => {
    //       this.tableService.systemsTableClick(data[0]);
    //       // this.getInterfaceData(row.ID);
    //     });
    //   }
    // });
  }

  // onFilterEvent(filter: string) {
  //     if(filter === 'Inactive') {
  //       this.tableCols = this.inactiveColumnDefs;
  //       // Hide visualization when on alternative filters
  //       $('#sysViz').collapse('hide');
  //     } else if(filter === 'Cloud Enabled'){
  //       this.tableCols = this.defaultTableCols;
  //       // Hide visualization when on alternative filters
  //       $('#sysViz').collapse('hide');
  //     } else {
  //       this.tableCols = this.defaultTableCols;
  //       // Hide visualization when on alternative filters
  //       $('#sysViz').collapse('show');
  //     }
  // }

  public isLoggedIn(): boolean {
    return this.sharedService.loggedIn;
  }

  getAriaLabel(data: { name: string, value: number }[]): string {
    const total = data.reduce((acc, cur) => acc + cur.value, 0);
    if (data.length === 1) {
      return `Pie chart representing ${total} total active systems, all of which are ${data[0].value} ${data[0].name}`;
    } else {
      const labels = data.map(item => `${Math.round((item.value / total) * 100)}% are ${item.name}`).join(', ');
      return `Pie chart representing ${total} total active systems, of which ${labels}}`;
    }
  }

  public onRowClick(e: any) {
    const searchTerm: string = e.tableSearchString || '';
    this.router.navigate(['/systems', e.ID], {
        queryParams: { tableSearchTerm: searchTerm }
    });
  }

  onSelect(chartData: any): void {
  this.sharedService.disableStickyHeader("systemTable");
  this.filteredTable = true;
  this.filterTitle = chartData.name;

  let filtered = this.systemsData.filter(s =>
    s.Status === 'Active' &&
    s.BusApp === 'Yes' &&
    s.BusOrgSymbolAndName === chartData.name
  );

  if (this.selectedTab === 'Cloud Enabled') {
    filtered = filtered.filter(s => s.CloudYN === 'Yes');
  } else if (this.selectedTab === 'Inactive') {
    filtered = this.systemsData.filter(s =>
      s.Status === 'Inactive' &&
      s.BusApp === 'Yes' &&
      s.BusOrgSymbolAndName === chartData.name
    );
  }

  this.systemsDataTabFilterted = filtered;
  this.tableService.updateReportTableData(this.systemsDataTabFilterted);
  this.tableService.updateReportTableDataReadyStatus(true);
  this.sharedService.enableStickyHeader("systemTable");
  }

  getTooltip (name: string): string {
    const def = this.attributeDefs.find(def => def.Term === name);
    if(def){
      return def.TermDefinition;
    }
    return '';
  }
}