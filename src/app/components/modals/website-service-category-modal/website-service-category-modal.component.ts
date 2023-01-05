import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { ApiService } from '@services/apis/api.service';
import { ModalsService } from '@services/modals/modals.service';
import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'website-service-category-modal',
  templateUrl: './website-service-category-modal.component.html',
  styleUrls: ['./website-service-category-modal.component.css'],
})
export class WebsiteServiceCategoryModalComponent implements OnInit {
  websiteServiceCategory = <any>{};
  serviceCategoryWebsites = <any>{};

  constructor(
    private apiService: ApiService,
    private location: Location,
    public modalService: ModalsService,
    private route: ActivatedRoute,
    private router: Router,
    public sharedService: SharedService,
    public tableService: TableService
  ) {}

  serviceCategoryWebsitesTableOptions: {} =
    this.tableService.createTableOptions({
      advancedSearch: true,
      idTable: null,
      classes: 'table-hover table-light clickable-table',
      showColumns: false,
      showExport: true,
      exportFileName: null,
      headerStyle: 'bg-royal-blue',
      pagination: false,
      search: true,
      sortName: 'domain',
      sortOrder: 'desc',
      showToggle: true,
      url: null,
    });

  // Related Website Table Columns
  serviceCategoryWebsitesColumnDefs: any[] = [
    {
      field: 'website_id',
      title: 'Website Id',
      sortable: true,
    },
    {
      field: 'domain',
      title: 'Domain',
      sortable: true,
      visible: true,
    },
    {
      field: 'site_owner_email',
      title: 'Website Manager Email',
      sortable: true,
    },
    {
      field: 'office',
      title: 'Office',
      sortable: true,
    },
    {
      field: 'sub_office',
      title: 'Sub-Office',
      sortable: true,
    },
  ];

  ngOnInit(): void {
    this.modalService.currentWebsiteServiceCategory.subscribe(
      (websiteServiceCategory) => {
        this.websiteServiceCategory = websiteServiceCategory;
      }
    );

    $('#websiteServiceCategoryWebsites').bootstrapTable({
      columns: this.serviceCategoryWebsitesColumnDefs,
      data: [],
    });

    // Method to handle click events on the Related Systems table
    $(document).ready(
      $('#serviceCategoryRelSysTable').on(
        'click-row.bs.table',
        function (e, row) {
          // Hide First Modal before showing new modal
          $('#websiteServiceCategoryDetail').modal('hide');

          this.tableService.systemsTableClick(row);
        }.bind(this)
      )
    );

    // Revert back to overview tab when modal goes away
    $('#websiteServiceCategoryDetail').on(
      'hidden.bs.modal',
      function (e) {
        $('#websiteServiceCategoryTabs li:first-child a').tab('show');

        // Change URL back without ID after closing Modal
        this.sharedService.removeIDfromURL();
      }.bind(this)
    );
  }

  serviceCategoryEdit() {
    // Hide Detail Modal before showing Manager Modal
    $('#websiteServiceCategoryDetail').modal('hide');
    this.modalService.updateDetails(
      this.websiteServiceCategory,
      'websiteServiceCategory',
      false
    );

    // $('#serviceCategoryManager').modal('show');
  }
}
