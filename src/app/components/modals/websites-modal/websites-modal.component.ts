import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { ApiService } from '@services/apis/api.service';
import { ModalsService } from '@services/modals/modals.service';
import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';
import { Title } from '@angular/platform-browser';

import { WebsiteServiceCategory } from '@api/models/website-service-category.model';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'websites-modal',
  templateUrl: './websites-modal.component.html',
  styleUrls: ['./websites-modal.component.css'],
})
export class WebsitesModalComponent implements OnInit {
  website = <any>{};
  websiteScans = <any>this.getBlankWebsiteScan();
  websiteServiceCategories = <WebsiteServiceCategory[]>[];

  constructor(
    private apiService: ApiService,
    private location: Location,
    public modalService: ModalsService,
    private route: ActivatedRoute,
    private router: Router,
    public sharedService: SharedService,
    public tableService: TableService,
    private titleService: Title
  ) {}

  // Website scan Table Options
  websiteScanTableOptions: {} = this.tableService.createTableOptions({
    advancedSearch: true,
    idTable: null,
    classes: 'table-hover table-light clickable-table',
    showColumns: false,
    showExport: true,
    exportFileName: null,
    headerStyle: 'bg-danger',
    pagination: false,
    search: true,
    sortName: 'scan_date',
    sortOrder: 'desc',
    showToggle: true,
    url: null,
  });

  // Related Business Capabiltiies Table Columns
  websiteScanColumnDefs: any[] = [
    {
      field: 'Scan_ID',
      title: 'Scan Id',
      sortable: true,
    },
    {
      field: 'scan_date',
      title: 'Scan Date',
      sortable: true,
      visible: true,
    },
    {
      field: 'scan_version',
      title: 'Scan Version',
      sortable: true,
    },
  ];

  ngOnInit(): void {
    this.modalService.currentWebsite.subscribe((website) => {
      this.website = website;
      this.apiService
        .getWebsiteScans(this.website.Website_ID)
        .subscribe(
          (websiteScanData) =>
            (this.websiteScans =
              websiteScanData.length > 0
                ? websiteScanData
                : this.getBlankWebsiteScan())
        );
      this.apiService
        .getWebsiteServiceCategories(this.website.Website_ID)
        .subscribe(
          (websiteServiceCategories) =>
            (this.websiteServiceCategories = websiteServiceCategories)
        );
    });

    $('#websitesRelSysTable').bootstrapTable(
      $.extend(this.tableService.relSysTableOptions, {
        columns: this.tableService.relSysColumnDefs,
        data: [],
      })
    );

    const self = this;
    $(document).ready(function() {
      // Method to handle click events on the Related Systems table
      $('#websitesRelSysTable').on('click-row.bs.table', function (e, row) {
        // Hide First Modal before showing new modal
        $('#websiteDetail').modal('hide');
        self.tableService.systemsTableClick(row);
      }.bind(this));
    });

    // Revert back to overview tab when modal goes away
    $('#websiteDetail').on(
      'hidden.bs.modal',
      function (e) {
        $('#websiteTabs li:first-child a').tab('show');

        // Change URL back without ID after closing Modal
        this.sharedService.removeIDfromURL();
      }.bind(this)
    );
  }

  websiteEdit() {
    // Hide Detail Modal before showing Manager Modal
    $('#websiteDetail').modal('hide');
    this.modalService.updateDetails(this.website, 'website', false);
    this.sharedService.setWebsiteForm();
    $('#websiteManager').modal('show');
  }

  getBlankWebsiteScan() {
    return [
      {
        Scan_ID: 0,
        Website_ID: this.website.Website_ID,
        desktop_img_file_name: 'desktop.png',
        mobile_img_file_name: 'mobile.png',
        scan_date: '',
        scan_version: '',
      },
    ];
  }

  websiteServiceCategoryClick(id) {
    this.apiService
      .getOneWebsiteServiceCategory(id)
      .subscribe((data: any[]) => {
        this.tableService.websiteServiceCategoryTableClick(data[0]);
      });
    $('#websiteDetail').modal('hide');
  }

  getValues(value, maxValue) {
    return { '--value': value, '--max': maxValue };
  }
}
