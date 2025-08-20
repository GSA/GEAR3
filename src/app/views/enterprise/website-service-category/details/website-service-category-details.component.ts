import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Service_Category } from '@api/models/service-category.model';
import { WebsiteServiceCategory } from '@api/models/website-service-category.model';
import { ApiService } from '@services/apis/api.service';
import { TableService } from '@services/tables/table.service';

@Component({
    selector: 'website-service-category-details',
    templateUrl: './website-service-category-details.component.html',
    styleUrls: ['./website-service-category-details.component.scss'],
    standalone: false
})
export class WebsiteServiceCategoryDetailsComponent implements OnInit {

  public websiteServiceCategoryId: number = null;
  public detailsData: WebsiteServiceCategory;
  public isDataReady: boolean = false;

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
    });
  }
}
