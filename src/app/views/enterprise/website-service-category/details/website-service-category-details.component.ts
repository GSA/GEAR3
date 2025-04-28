import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Service_Category } from '@api/models/service-category.model';
import { Website } from '@api/models/websites.model';
import { Column } from '@common/table-classes';
import { ApiService } from '@services/apis/api.service';
import { TableService } from '@services/tables/table.service';

@Component({
  selector: 'website-service-category-details',
  templateUrl: './website-service-category-details.component.html',
  styleUrls: ['./website-service-category-details.component.scss'],
})
export class WebsiteServiceCategoryDetailsComponent implements OnInit {

  public websiteServiceCategoryId: number = null;
  public detailsData: Service_Category;
  public isDataReady: boolean = false;
  public relatedWebsites: Website[] = [];

  public relatedWebsitesTableCols: Column[] = [
    {
      field: 'website_id',
      header: 'Website Id',
      isSortable: true
    },
    {
      field: 'domain',
      header: 'Domain',
      isSortable: true
    },
    {
      field: 'site_owner_email',
      header: 'Website Manager Email',
      isSortable: true
    },
    {
      field: 'office',
      header: 'Office',
      isSortable: true
    },
    {
      field: 'sub_office',
      header: 'Sub-Office',
      isSortable: true
    },
    {
      field: 'production_status',
      header: 'Production Status',
      isSortable: true
    },
  ];

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private tableService: TableService
  ) {
  }

  public ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.websiteServiceCategoryId = +params.get('websiteServiceCategoryID');

      // Get Website Service Category details
      this.apiService.getOneWebsiteServiceCategory(this.websiteServiceCategoryId).subscribe(w => {
        this.detailsData = w;
        this.isDataReady = true;
      });

      // Get Related Websites
      this.apiService.getWebsiteServiceCategoryRelatedWebsites(this.websiteServiceCategoryId).subscribe(r => {
        this.relatedWebsites = r;
        this.tableService.updateReportTableData(this.relatedWebsites);
      });
    });
  }
}
