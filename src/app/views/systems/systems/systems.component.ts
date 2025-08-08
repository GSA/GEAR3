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

// Declare D3 & Sankey library
// declare var d3: any;
// import * as d3Sankey from 'd3-sankey';

// // Declare jQuery symbol
// declare var $: any;

@Component({
  selector: 'systems',
  templateUrl: './systems.component.html',
  styleUrls: ['./systems.component.scss'],
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
  public selectedTab: string = 'All';
  public filterTotals: any = null;

  public systemsData: System[] = [];
  public systemsDataTabFilterted: System[] = [];

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
    this.systemsDataTabFilterted = this.systemsData;

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
  }

  public isTabSelected(tabName: string): boolean {
    return this.selectedTab === tabName;
  }

  defaultTableCols: Column[] = [
    {
      field: 'ID',
      header: 'ID',
      isSortable: true,
      showColumn: false,
    },
    {
      field: 'DisplayName',
      header: 'Alias / Acronym',
      isSortable: true,
    },
    {
      field: 'Name',
      header: 'System Name',
      isSortable: true,
    },
    {
      field: 'Description',
      header: 'Description',
      isSortable: true,
      showColumn: true,
      formatter: this.sharedService.formatDescriptionShorter
    },
    {
      field: 'SystemLevel',
      header: 'System Level',
      isSortable: true,
    },
    {
      field: 'Status',
      header: 'Status',
      isSortable: true,
    },
    {
      field: 'RespOrg',
      header: 'Responsible Org',
      isSortable: true,
    },
    {
      field: 'BusOrgSymbolAndName',
      header: 'SSO/CXO',
      isSortable: true,
    },
    {
      field: 'BusOrg',
      header: 'Business Org',
      isSortable: true,
    },
    {
      field: 'ParentName',
      header: 'Parent System',
      isSortable: true,
      showColumn: false,
    },
    {
      field: 'CSP',
      header: 'Hosting Provider',
      isSortable: true,
      showColumn: false,
    },
    {
      field: 'CloudYN',
      header: 'Cloud Hosted?',
      isSortable: true,
      showColumn: false,
    },
    {
      field: 'ServiceType',
      header: 'Cloud Service Type',
      isSortable: true,
      showColumn: false,
    },
    {
      field: 'AO',
      header: 'Authorizing Official',
      isSortable: true,
      showColumn: false,
      formatter: this.sharedService.pocStringNameFormatter,
    },
    {
      field: 'SO',
      header: 'System Owner',
      isSortable: true,
      showColumn: false,
      formatter: this.sharedService.pocStringNameFormatter,
    },
    {
      field: 'BusPOC',
      header: 'Business POC',
      isSortable: true,
      showColumn: false,
      formatter: this.sharedService.pocStringNameFormatter,
    },
    {
      field: 'TechPOC',
      header: 'Technical POC',
      isSortable: true,
      showColumn: false,
      formatter: this.sharedService.pocStringNameFormatter,
    },
    {
      field: 'DataSteward',
      header: 'Data Steward',
      isSortable: true,
      showColumn: false,
      formatter: this.sharedService.pocStringNameFormatter,
    },
    {
      field: 'FISMASystemIdentifier',
      header: 'FISMA System Identifier',
      isSortable: true,
      showColumn: false
    },
  ];

  // Inactive Column Defs
  inactiveColumnDefs: Column[] = [
    {
      field: 'Name',
      header: 'System Name',
      isSortable: true,
    },
    {
      field: 'Description',
      header: 'Description',
      isSortable: true,
      showColumn: true,
      formatter: this.sharedService.formatDescription
    },
    {
      field: 'SystemLevel',
      header: 'System Level',
      isSortable: true,
    },
    {
      field: 'Status',
      header: 'Status',
      isSortable: true,
    },
    {
      field: 'RespOrg',
      header: 'Responsible Org',
      isSortable: true,
    },
    {
      field: 'BusOrg',
      header: 'Business Org',
      isSortable: true,
    },
    {
      field: 'CSP',
      header: 'Cloud Server Provider',
      isSortable: true,
      showColumn: false,
    },
    {
      field: 'CloudYN',
      header: 'Cloud Hosted?',
      isSortable: true,
      showColumn: false,
    },
    {
      field: 'AO',
      header: 'Authorizing Official',
      isSortable: true,
      showColumn: false,
      formatter: this.sharedService.pocStringNameFormatter,
    },
    {
      field: 'SO',
      header: 'System Owner',
      isSortable: true,
      showColumn: false,
      formatter: this.sharedService.pocStringNameFormatter,
    },
    {
      field: 'InactiveDate',
      header: 'Inactive Date',
      isSortable: true,
      formatter: this.sharedService.dateFormatter,
    },
  ];

  ngOnInit(): void {
    // // Set JWT when logged into GEAR Manager when returning from secureAuth
    // this.sharedService.setJWTonLogIn();

    this.tableCols = this.defaultTableCols;

    this.apiService.getSystems().subscribe(systems => {
      this.systemsData = systems;

      systems.forEach(s => {
        if(s.Status === 'Active' && s.BusApp === 'Yes') {
          this.systemsDataTabFilterted.push(s);
        }
      });

      this.tableService.updateReportTableData(this.systemsDataTabFilterted);
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
    this.router.navigate(['systems', e.ID]);
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
  this.sharedService.enableStickyHeader("systemTable");
}
}