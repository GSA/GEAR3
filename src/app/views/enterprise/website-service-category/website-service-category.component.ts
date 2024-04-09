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
  selector: 'website-service-category',
  templateUrl: './website-service-category.component.html',
  styleUrls: ['./website-service-category.component.css'],
})
export class WebsiteServiceCategoryComponent implements OnInit {
  row: Object = <any>{};

  constructor(
    private apiService: ApiService,
    private location: Location,
    private modalService: ModalsService,
    private route: ActivatedRoute,
    private router: Router,
    private sharedService: SharedService,
    private tableService: TableService,
    private titleService: Title
  ) {
    this.modalService.currentWebsiteServiceCategory.subscribe(
      (row) => (this.row = row)
    );
  }

  // websiteServiceCategory Table Options
  tableOptions: {} = this.tableService.createTableOptions({
    advancedSearch: true,
    idTable: 'websiteServiceCategoryTable',
    classes: 'table-hover table-dark clickable-table',
    showColumns: false,
    showExport: true,
    exportFileName: 'GSA_websiteServiceCategory',
    exportIgnoreColumn:[2],
    headerStyle: 'bg-royal-blue',
    pagination: true,
    search: true,
    sortName: 'name',
    sortOrder: 'asc',
    showToggle: true,
    url: this.apiService.websiteServiceCategoryUrl,
  });

  // websiteServiceCategory Table Columns
  columnDefs: any[] = [
    {
      field: 'website_service_category_id',
      title: 'Id',
      sortable: true,
    },
    {
      field: 'name',
      title: 'Name',
      sortable: true,
    },
    {
      field: 'description',
      title: 'Description',
      sortable: true,
      visible: true,
      class: 'text-wrap',
      formatter: (value: any, row: any): string => {
        return value && value.length > 200 ? value.substring(0, 200) + "..." : value;
      }
    },
    {
      field: 'description',
      title: 'Description',
      sortable: true,
      visible: false,
      switchable: false,
      forceExport: true
    }
  ];

  ngOnInit(): void {
    // Enable popovers
    $(function () {
      $('[data-toggle="popover"]').popover();
    });

    $('#websiteServiceCategoryTable').bootstrapTable(
      $.extend(this.tableOptions, {
        columns: this.columnDefs,
        data: [],
      })
    );

    // Method to handle click events on the serviceCategory table
    $(document).ready(
      $('#websiteServiceCategoryTable').on(
        'click-row.bs.table',
        function (e, row) {
          this.tableService.websiteServiceCategoryTableClick(row);
        }.bind(this)
      )
    );

    // Method to open details modal when referenced directly via URL
    this.route.params.subscribe((params) => {
      var detailWebsiteServiceCategoryID = params['websiteServiceCategoryID'];
      if (detailWebsiteServiceCategoryID) {
        this.titleService.setTitle(
          `${this.titleService.getTitle()} - ${detailWebsiteServiceCategoryID}`
        );
        this.apiService
          .getOneWebsiteServiceCategory(detailWebsiteServiceCategoryID)
          .subscribe((data: any[]) => {
            this.tableService.websiteServiceCategoryTableClick(data[0]);
          });
      }
    });
  }
}
