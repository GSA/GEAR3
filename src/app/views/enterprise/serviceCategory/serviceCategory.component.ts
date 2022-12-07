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
  selector: 'serviceCategory',
  templateUrl: './serviceCategory.component.html',
  styleUrls: ['./serviceCategory.component.css'],
})
export class ServiceCategoryComponent implements OnInit {
  row: Object = <any>{};

  constructor(
    private apiService: ApiService,
    private location: Location,
    private modalService: ModalsService,
    private route: ActivatedRoute,
    private router: Router,
    private sharedService: SharedService,
    private tableService: TableService
  ) {
    this.modalService.currentInvest.subscribe((row) => (this.row = row));
  }

  // serviceCategory Table Options
  tableOptions: {} = this.tableService.createTableOptions({
    advancedSearch: true,
    idTable: 'serviceCategoryTable',
    classes: 'table-hover table-dark clickable-table',
    showColumns: false,
    showExport: true,
    exportFileName: 'GSA_serviceCategory',
    headerStyle: 'bg-royal-blue',
    pagination: true,
    search: true,
    sortName: 'name',
    sortOrder: 'asc',
    showToggle: true,
    url: this.apiService.serviceCategoryUrl,
  });

  // serviceCategory Table Columns
  columnDefs: any[] = [
    {
      field: 'service_category_id',
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
    },
  ];

  ngOnInit(): void {
    // Enable popovers
    $(function () {
      $('[data-toggle="popover"]').popover();
    });

    $('#serviceCategoryTable').bootstrapTable(
      $.extend(this.tableOptions, {
        columns: this.columnDefs,
        data: [],
      })
    );

    // Method to handle click events on the serviceCategory table
    $(document).ready(
      $('#serviceCategoryTable').on(
        'click-row.bs.table',
        function (e, row) {
          this.tableService.serviceCategoryTableClick(row);
        }.bind(this)
      )
    );

    // Method to open details modal when referenced directly via URL
    this.route.params.subscribe((params) => {
      var detailServiceCategoryID = params['serviceCategoryID'];
      if (detailServiceCategoryID) {
        this.apiService
          .getOneServiceCategory(detailServiceCategoryID)
          .subscribe((data: any[]) => {
            this.tableService.serviceCategoryTableClick(data[0]);
          });
      }
    });
  }
}
