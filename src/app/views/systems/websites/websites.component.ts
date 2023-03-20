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
      title: 'Site Owner',
      sortable: true,
    },
    {
      field: 'contact_email',
      title: 'Contact Email',
      sortable: true,
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
    },
    {
      field: 'required_by_law_or_policy',
      title: 'Required?',
      sortable: true,
    },
    {
      field: 'has_dap',
      title: 'Uses DAP?',
      sortable: true,
    },
    {
      field: 'mobile_friendly',
      title: 'Mobile Friendly?',
      sortable: true,
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
    },
    {
      field: 'https',
      title: 'HTTPS?',
      sortable: true,
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

  //The following is adapted from fisma.component.ts to filter on multiple columns of data rather than one
  // Update table to Cloud Business Systems
  showDecommissioned() {
    this.filteredTable = true;

    // Filter to only "Cloud" Business Systems/Subsystems
    $('#websitesTable').bootstrapTable('filterBy', {
      production_status: ['decommissioned'],
    });
  }

  resetTableFilters() {
    $('#websitesTable').bootstrapTable('filterBy', {
      production_status: ['production', 'archived'],
      type_of_site: ['informational', 'application', 'application login'],
    });
  }
}
