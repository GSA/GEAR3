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
  public selectedTab: string = 'All';
  public filterTotals: any = null;

  public systemsData: System[] = [];
  public systemsDataTabFilterted: System[] = [];

  public daysDecommissioned: number = 0;
  public hostingPlatformFilter: string = '';
  public selectedHostingPlatform: string = '';

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
    } else if (this.selectedTab === 'Not Cloud Based') {
      this.systemsDataTabFilterted = this.systemsData.filter(s => {
        return s.Status === 'Active' && s.BusApp === 'Yes' && s.CloudYN === 'No';
      });
      this.tableCols = this.defaultTableCols;
    } else if (this.selectedTab === 'Inactive') {
      this.systemsDataTabFilterted = this.systemsData.filter(s => {
        return s.Status === 'Inactive' && s.BusApp === 'Yes';
      });
      this.tableCols = this.inactiveColumnDefs;
    } else if (this.selectedTab.startsWith('Hosting Platform:')) {
      // Handle hosting platform filtering
      const platform = this.selectedTab.replace('Hosting Platform: ', '');
      
      this.systemsDataTabFilterted = this.filterSystemsByHostingPlatform(platform);
      this.tableCols = this.defaultTableCols;
    }
    this.tableService.updateReportTableData(this.systemsDataTabFilterted);
  }

  public isTabSelected(tabName: string): boolean {
    if (this.selectedTab.startsWith('Hosting Platform:')) {
      return tabName === this.selectedTab;
    }
    return this.selectedTab === tabName;
  }

  private getDashboardNormalizedPlatform(platform: string): string {
    // Match the dashboard's normalization logic
    switch (platform) {
      case 'AWS (GovCloud)':
      case 'AWS':
        return 'AWS';
      case 'cloud.gov':
        return 'Cloud.gov';
      default:
        return platform;
    }
  }

  private calculatePlatformCounts(): { [key: string]: number } {
    return this.systemsData
      .filter(system => system.Status === 'Active' && system.BusApp === 'Yes' && system.CSP)
      .reduce((counts, system) => {
        const platform = this.getDashboardNormalizedPlatform(system.CSP.trim());
        counts[platform] = (counts[platform] || 0) + 1;
        return counts;
      }, {} as { [key: string]: number });
  }

  private filterSystemsByHostingPlatform(platform: string): System[] {
    if (platform === 'Others' || platform === 'Other') {
      const platformCounts = this.calculatePlatformCounts();
      const smallPlatforms = Object.entries(platformCounts)
        .filter(([name, value]) => value < 3)
        .map(([name, value]) => name);

      return this.systemsData.filter(s => {
        if (!s.CSP) return false;
        const normalizedPlatform = this.getDashboardNormalizedPlatform(s.CSP.trim());
        return smallPlatforms.includes(normalizedPlatform) && s.Status === 'Active' && s.BusApp === 'Yes';
      });
    } else {
      return this.systemsData.filter(s => {
        if (!s.CSP) return false;
        const normalizedPlatform = this.sharedService.normalizePlatformName(s.CSP.trim());
        return normalizedPlatform === platform && s.Status === 'Active' && s.BusApp === 'Yes';
      });
    }
  }

  public getHostingPlatformCount(): number {
    if (!this.selectedHostingPlatform || !this.systemsData) return 0;
    return this.filterSystemsByHostingPlatform(this.selectedHostingPlatform).length;
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
      showColumn: true,
    },
    {
      field: 'CloudYN',
      header: 'Cloud Hosted?',
      isSortable: true,
      showColumn: true,
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
      showColumn: true,
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
    this.sharedService.setJWTonLogIn();

    // Check for tab parameter in route
    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        this.selectedTab = params['tab'];
      }
      if(params['decommissionedWithinDays']) {
        this.daysDecommissioned = +params['decommissionedWithinDays'];
      }
      if(params['hostingPlatform']) {
        this.hostingPlatformFilter = params['hostingPlatform'];
        this.selectedHostingPlatform = params['hostingPlatform'];
        this.selectedTab = `Hosting Platform: ${params['hostingPlatform']}`;
      }
      
      // Apply filters after parameters are set
      this.applyFilters();
    });

    this.apiService.getSystems().subscribe(systems => {
      this.systemsData = systems;
      
      
      // Calculate "Not Cloud Based" count
      const notCloudBasedCount = systems.filter(s => 
        s.Status === 'Active' && s.BusApp === 'Yes' && s.CloudYN === 'No'
      ).length;
      
      // Update filter totals with the calculated count
      if (this.filterTotals) {
        this.filterTotals.NotCloudBasedTotal = notCloudBasedCount;
      } else {
        // If filter totals not loaded yet, create a temporary object
        this.filterTotals = { NotCloudBasedTotal: notCloudBasedCount };
      }
      
      this.applyFilters();
    });

    this.apiService.getSystemsFilterTotals().subscribe(t => {
      this.filterTotals = t;
      
      // Calculate "Not Cloud Based" count if systems data is already loaded
      if (this.systemsData && this.systemsData.length > 0) {
        const notCloudBasedCount = this.systemsData.filter(s => 
          s.Status === 'Active' && s.BusApp === 'Yes' && s.CloudYN === 'No'
        ).length;
        this.filterTotals.NotCloudBasedTotal = notCloudBasedCount;
      }
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

  private applyFilters(): void {
    if (!this.systemsData || this.systemsData.length === 0) {
      return;
    }

    if(this.daysDecommissioned > 0) {
      const now = new Date(); // Current date and time
      const expiringWithin = new Date();
      expiringWithin.setDate(now.getDate() + this.daysDecommissioned); // number of days set in the url
      const expiringFiltered = [];
      this.systemsData.forEach(s => {
        let renewal = new Date(s.RenewalDate);
        if(s.RenewalDate && (renewal >= now && renewal <= expiringWithin) && (s.Status === 'Inactive') && (s.BusApp === 'Yes')) {
          expiringFiltered.push(s);
        }
      });
      this.tableService.updateReportTableData(expiringFiltered);
      return;
    } else { 
      // Apply tab filter based on selectedTab
      this.onSelectTab(this.selectedTab);
    }
  }
}
