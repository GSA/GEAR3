import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { ApiService } from '@services/apis/api.service';
import { ModalsService } from '@services/modals/modals.service';
import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';
import { Title } from '@angular/platform-browser';

import { FilterButton, Column, TwoDimArray } from '../../../common/table-classes';
import { Website } from '@api/models/websites.model';

@Component({
  selector: 'websites',
  templateUrl: './websites.component.html',
  styleUrls: ['./websites.component.scss'],
})
export class WebsitesComponent implements OnInit {
  public defExpanded: boolean = false;
  public selectedTab: string = 'All';
  public filterTotals: any = null;
  public websitesData: Website[] = [];
  public websitesTabFilterted: Website[] = [];

  constructor(
    private apiService: ApiService,
    private location: Location,
    private modalService: ModalsService,
    private route: ActivatedRoute,
    private router: Router,
    public sharedService: SharedService,
    private tableService: TableService,
    private titleService: Title
  ) {}

  // filterButtons: TwoDimArray<FilterButton> = [
  //   [
  //     {
  //       buttonText: 'Decommissioned',
  //       filters: [
  //         { field: 'production_status', value: 'decommissioned' }
  //       ]
  //     },
  //     {
  //       buttonText: 'Redirects',
  //       filters: [
  //         { field: 'production_status', value: 'redirect' }
  //       ]
  //     },
  //     {
  //       buttonText: 'External',
  //       filters: [
  //         { field: 'digital_brand_category', value: 'External' }
  //       ]
  //     }
  //   ]
  // ];

  public tableCols: Column[] = [
    {
      field: 'domain',
      header: 'Domain',
      isSortable: true,
    },
    {
      field: 'office',
      header: 'Office',
      isSortable: true,
    },
    {
      field: 'site_owner_email',
      header: 'Website Manager',
      isSortable: true,
    },
    {
      field: 'contact_email',
      header: 'Contact Email',
      isSortable: true,
      showColumn: false,
    },
    {
      field: 'production_status',
      header: 'Status',
      isSortable: true,
    },
    {
      field: 'redirects_to',
      header: 'Redirect URL',
      isSortable: true,
      showColumn: false,
    },
    {
      field: 'required_by_law_or_policy',
      header: 'Required by Law/Policy?',
      isSortable: true,
      showColumn: false,
    },
    {
      field: 'has_dap',
      header: 'DAP Enabled',
      isSortable: true,
      showColumn: false,
    },
    {
      field: 'https',
      header: 'HTTPS Enabled',
      isSortable: true,
      showColumn: false,
    },
    {
      field: 'mobile_friendly',
      header: 'Mobile Friendly?',
      isSortable: true,
      showColumn: false,
    },
    {
      field: 'has_search',
      header: 'Has Search?',
      isSortable: true,
    },
    {
      field: 'repository_url',
      header: 'Repository URL',
      isSortable: true,
      showColumn: false,
    },
    {
      field: 'hosting_platform',
      header: 'Hosting Platform',
      isSortable: true,
    },
    {
      field: 'cms_platform',
      header: 'Content Management Platform',
      isSortable: true,
      showColumn: false,
    },
    {
      field: 'sub_office',
      header: 'Sub-office',
      isSortable: false,
      showColumn: false,
      class: 'text-truncate',
    },
    {
      field: 'type_of_site',
      header: 'Type of Site',
      isSortable: true,
      showColumn: true,
      class: 'text-truncate',
    },
    {
      field: 'digital_brand_category',
      header: 'Digital Brand Category',
      isSortable: true,
      showColumn: false,
      formatter: this.sharedService.formatDescription
    },
    {
      field: 'target_decommission_date',
      header: 'Target Decommission Date',
      isSortable: true,
      showColumn: false,
      formatter: this.sharedService.utcDateFormatter
    },
    {
      field: 'sitemap_url',
      header: 'Sitemap URL',
      isSortable: false,
      showColumn: false
    },
];

  ngOnInit(): void {
    // Set JWT when logged into GEAR Manager when returning from secureAuth
    this.sharedService.setJWTonLogIn();

    this.apiService.getWebsites().subscribe(websites => {
      this.websitesData = websites;

      // Filter websites for inital view data
      websites.forEach(w => {
        if(
          (w.production_status === 'production') &&
          (w.digital_brand_category !== 'External') &&
          (w.type_of_site === 'Informational' || w.type_of_site === 'Application' || w.type_of_site === 'Application Login')
        ) {
          this.websitesTabFilterted.push(w);
        }
      });
      this.tableService.updateReportTableData(this.websitesTabFilterted);
      
    });

    this.apiService.getWebsitesFilterTotals().subscribe(t => {
      this.filterTotals = t;
    });

    // Method to open details modal when referenced directly via URL
    this.route.params.subscribe((params) => {
      let detailwebsiteID = params['websiteID'];

      if (detailwebsiteID) {
        this.titleService.setTitle(
          `${this.titleService.getTitle()} - ${detailwebsiteID}`
        );
        this.apiService
          .getOneWebsite(detailwebsiteID)
          .subscribe((data: any) => {
            this.tableService.websitesTableClick(data[0]);
          });
      }
    });
  }

  // onFilterClick(filterButtons: FilterButton[]) {
  //   this.tableData = this.tableDataOriginal;
  //   this.tableService.filterButtonClick(filterButtons, this.tableData);
  // }

  // onFilterResetClick() {
  //   this.tableData = this.filteredTableData;
  //   this.tableService.updateReportTableData(this.tableData);
  // }

  public onViewAll(): void {
    this.defExpanded = !this.defExpanded;
  }

  public onSelectTab(tabName: string): void {
    this.selectedTab = tabName;
    this.websitesTabFilterted = this.websitesData;

    if(this.selectedTab === 'All') {
      this.websitesTabFilterted = this.websitesData.filter(w => {
        return w.production_status === 'production' && w.digital_brand_category !== 'External' &&
        (w.type_of_site === 'Informational' || w.type_of_site === 'Application' || w.type_of_site === 'Application Login');
      });
    } else if (this.selectedTab === 'Decommissioned') {
      this.websitesTabFilterted = this.websitesData.filter(w => {
        return w.production_status === 'decommissioned';
      });
    } else if (this.selectedTab === 'Redirects') {
      this.websitesTabFilterted = this.websitesData.filter(w => {
        return w.production_status === 'redirect';
      });
    } else if (this.selectedTab === 'External') {
      this.websitesTabFilterted = this.websitesData.filter(w => {
        return w.digital_brand_category === 'External';
      });
    }
    this.tableService.updateReportTableData(this.websitesTabFilterted);
  }

  public isTabSelected(tabName: string): boolean {
    return this.selectedTab === tabName;
  }

  public onRowClick(e: any) {
    this.router.navigate(['websites', e.website_id]);
  }

}
