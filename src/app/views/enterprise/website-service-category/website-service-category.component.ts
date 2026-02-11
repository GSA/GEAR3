import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ApiService } from '@services/apis/api.service';
import { ModalsService } from '@services/modals/modals.service';
import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';
import { Title } from '@angular/platform-browser';
import { Column } from '../../../common/table-classes';
import { Service_Category } from '@api/models/service-category.model';
import { DataDictionary } from '@api/models/data-dictionary.model';

@Component({
    selector: 'website-service-category',
    templateUrl: './website-service-category.component.html',
    styleUrls: ['./website-service-category.component.scss'],
    standalone: false
})
export class WebsiteServiceCategoryComponent implements OnInit {
  public defExpanded: boolean = false;

  public attrDefinitions: DataDictionary[] = [];

  row: Object = <any>{};

  constructor(
    private apiService: ApiService,
    private modalService: ModalsService,
    private route: ActivatedRoute,
    private sharedService: SharedService,
    private tableService: TableService,
    private titleService: Title,
    private router: Router
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
    this.apiService.getDataDictionaryByReportName('Website Service Categories').subscribe(defs => {
      this.attrDefinitions = defs
    });

    this.apiService.getWebsiteServiceCategory().subscribe(w => {
      this.tableService.updateReportTableData(w);
      this.tableService.updateReportTableDataReadyStatus(true);
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
          .subscribe((data: any) => {
            this.tableService.websiteServiceCategoryTableClick(data[0]);
          });
      }
    });
  }

  public onViewAll(): void {
    this.defExpanded = !this.defExpanded;
  }

  public onRowClick(e: any) {
    const searchTerm: string = e.tableSearchString || '';
    this.router.navigate(['/website_service_category', e.website_service_category_id], {
        queryParams: { tableSearchTerm: searchTerm }
    });
  }
}
