import { PLATFORM_ID, Component, OnInit, Inject } from '@angular/core';
import { isPlatformBrowser, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { ApiService } from '@services/apis/api.service';
import { ModalsService } from '@services/modals/modals.service';
import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';
import { Title } from '@angular/platform-browser';

import { ButtonFilter, Column, TwoDimArray } from '../../../common/table-classes';
import { Website } from '@api/models/websites.model';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'websites',
  templateUrl: './websites.component.html',
  styleUrls: ['./websites.component.css'],
})
export class WebsitesComponent implements OnInit {
  filteredTable: boolean = false;

  constructor(
    private apiService: ApiService,
    private location: Location,
    private modalService: ModalsService,
    private route: ActivatedRoute,
    private router: Router,
    public sharedService: SharedService,
    private tableService: TableService,
    private titleService: Title,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  tableData: Website[] = [];

  buttonFilters: TwoDimArray<ButtonFilter> = [
    [
      { field: 'production_status', filterBtnText: 'Production', filterOn: 'production' },
      { field: 'production_status', filterBtnText: 'Decommissioned', filterOn: 'decommissioned' },
      { field: 'production_status', filterBtnText: 'Redirects', filterOn: 'redirect' },
      { field: 'production_status', filterBtnText: 'Staging', filterOn: 'staging' }
    ]
  ];

  tableCols: Column[] = [
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
];

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    // Enable popovers
    $(function () {
      $('[data-toggle="popover"]').popover();
    });

    // Set JWT when logged into GEAR Manager when returning from secureAuth
    this.sharedService.setJWTonLogIn();

    this.apiService.getWebsites().subscribe(w => this.tableData = w);

    // Method to open details modal when referenced directly via URL
    this.route.params.subscribe((params) => {
      let detailwebsiteID = params['websiteID'];

      if (detailwebsiteID) {
        this.titleService.setTitle(
          `${this.titleService.getTitle()} - ${detailwebsiteID}`
        );
        this.apiService
          .getOneWebsite(detailwebsiteID)
          .subscribe((data: any[]) => {
            this.tableService.websitesTableClick(data[0]);
          });
      }
    });
  }

  showProduction() {
    this.filteredTable = true;
    $('#websitesTable').bootstrapTable('filterBy', {
      production_status: ['production'],
      type_of_site: ['Informational', 'Application', 'Application Login'],
      digital_brand_category: ['GSA Business', 'Hybrid', ''],
    });
  }

  showDecommissioned() {
    this.filteredTable = true;
    $('#websitesTable').bootstrapTable('filterBy', {
      production_status: ['decommissioned'],
    });
  }

  showRedirect() {
    this.filteredTable = true;
    $('#websitesTable').bootstrapTable('filterBy', {
      production_status: ['redirect'],
    });
  }

  showStaging() {
    this.filteredTable = true;
    $('#websitesTable').bootstrapTable('filterBy', {
      production_status: ['staging'],
    });
  }

  resetTableFilters() {
    $('#websitesTable').bootstrapTable('filterBy', {
      production_status: ['production', 'archived'],
      type_of_site: ['Informational', 'Application', 'Application Login'],
    });
    this.filteredTable = false;
  }
}
