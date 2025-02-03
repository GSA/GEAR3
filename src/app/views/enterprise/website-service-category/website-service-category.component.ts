import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { ApiService } from '@services/apis/api.service';
import { ModalsService } from '@services/modals/modals.service';
import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';
import { Title } from '@angular/platform-browser';
import { Column } from '../../../common/table-classes';
import { Service_Category } from '@api/models/service-category.model';

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
    private modalService: ModalsService,
    private route: ActivatedRoute,
    private sharedService: SharedService,
    private tableService: TableService,
    private titleService: Title
  ) {
    this.modalService.currentWebsiteServiceCategory.subscribe(
      (row) => (this.row = row)
    );
  }

  tableData: Service_Category[] = [];
  tableDataOriginal: Service_Category[] = [];

  tableCols: Column[] = [
    {
      field: 'website_service_category_id',
      header: 'Id',
      isSortable: true,
    },
    {
      field: 'name',
      header: 'Name',
      isSortable: true,
    },
    {
      field: 'description',
      header: 'Description',
      isSortable: true,
      formatter: this.sharedService.formatDescription
    }
  ];

  ngOnInit(): void {
    // Enable popovers
    $(function () {
      $('[data-toggle="popover"]').popover();
    });

    this.apiService.getWebsiteServiceCategory().subscribe(w => {
      this.tableService.updateReportTableData(w);
      this.tableData = w;
      this.tableDataOriginal = w;
    });

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
