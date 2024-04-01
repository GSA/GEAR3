import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { ApiService } from '@services/apis/api.service';
import { ModalsService } from '@services/modals/modals.service';
import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';
import { Title } from '@angular/platform-browser';

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
    private titleService: Title
  ) {}

  // Websites Table Options
  tableOptions: {} = this.tableService.createTableOptions({
    advancedSearch: true,
    idTable: 'WebsitesTable',
    classes: 'table-hover table-dark clickable-table',
    showColumns: true,
    showExport: true,
    exportFileName: 'GSA_Websites',
    headerStyle: 'bg-danger',
    pagination: true,
    search: true,
    sortName: 'domain',
    sortOrder: 'asc',
    showToggle: true,
    url: this.apiService.websitesUrl,
  });

  // Apps Table Columns
  columnDefs: any[] = [
    {
      field: 'domain',
      title: 'Domain',
      sortable: true,
    },
    {
      field: 'office',
      title: 'Office',
      sortable: true,
    },
    {
      field: 'site_owner_email',
      title: 'Website Manager',
      sortable: true,
    },
    {
      field: 'contact_email',
      title: 'Contact Email',
      sortable: true,
      visible: false,
    },
    {
      field: 'production_status',
      title: 'Status',
      sortable: true,
    },
    {
      field: 'redirects_to',
      title: 'Redirect URL',
      sortable: true,
      visible: false,
    },
    {
      field: 'required_by_law_or_policy',
      title: 'Required by Law/Policy?',
      sortable: true,
      visible: false,
    },
    {
      field: 'has_dap',
      title: 'DAP Enabled',
      sortable: true,
      visible: false,
    },
    {
      field: 'https',
      title: 'HTTPS Enabled',
      sortable: true,
      visible: false,
    },
    {
      field: 'mobile_friendly',
      title: 'Mobile Friendly?',
      sortable: true,
      visible: false,
    },
    {
      field: 'has_search',
      title: 'Has Search?',
      sortable: true,
    },
    {
      field: 'repository_url',
      title: 'Repository URL',
      sortable: true,
      visible: false,
    },
    {
      field: 'hosting_platform',
      title: 'Hosting Platform',
      sortable: true,
    },
    {
      field: 'cms_platform',
      title: 'Content Management Platform',
      sortable: true,
      visible: false,
    },
    {
      field: 'sub_office',
      title: 'Sub-office',
      sortable: false,
      visible: false,
      class: 'text-truncate',
    },
    {
      field: 'type_of_site',
      title: 'Type of Site',
      sortable: true,
      visible: true,
      class: 'text-truncate',
    },
    {
      field: 'digital_brand_category',
      title: 'Digital Brand Category',
      sortable: true,
      visible: false,
      class: 'text-wrap',
    },
  ];

  ngOnInit(): void {
    // Enable popovers
    $(function () {
      $('[data-toggle="popover"]').popover();
    });

    // Set JWT when logged into GEAR Manager when returning from secureAuth
    this.sharedService.setJWTonLogIn();

    $('#websitesTable').bootstrapTable(
      $.extend(this.tableOptions, {
        columns: this.columnDefs,
        data: [],
      })
    );

    // Sets initial filtering of table
    $(document).ready(this.resetTableFilters());

    // Method to handle click events on the Website table
    $(document).ready(
      $('#websitesTable').on(
        'click-row.bs.table',
        function (e, row) {
          this.tableService.websitesTableClick(row);
        }.bind(this)
      )
    );

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
      digital_brand_category: ['GSA Business', 'Hybrid'],
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
