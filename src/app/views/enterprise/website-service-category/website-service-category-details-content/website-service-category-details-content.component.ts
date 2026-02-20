import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Service_Category } from '@api/models/service-category.model';
import { WebsiteServiceCategory } from '@api/models/website-service-category.model';
import { Website } from '@api/models/websites.model';
import { Column } from '@common/table-classes';
import { RelatedWebsitesColumns } from '@common/table-columns/related-websites';
import { ApiService } from '@services/apis/api.service';
import { TableService } from '@services/tables/table.service';

@Component({
    selector: 'website-service-category-details-content',
    templateUrl: './website-service-category-details-content.component.html',
    styleUrls: ['./website-service-category-details-content.component.scss'],
    standalone: false
})
export class WebsiteServiceCategoryDetailsContentComponent implements OnInit {

  @Input() data: WebsiteServiceCategory;
  @Input() showToolbar: boolean = true;
  @Input() showPagination: boolean = true;
  public relatedWebsites: Website[] = [];

  public relatedWebsitesTableCols: Column[] = RelatedWebsitesColumns;

  public isDataReady: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private tableService: TableService,
    private router: Router
  ) {
  }

  public ngOnInit(): void {
    this.apiService.getWebsiteServiceCategoryRelatedWebsites(this.data.website_service_category_id).subscribe(r => {
      this.relatedWebsites = r;
      this.isDataReady = true;
    });
  }

  public onRowClick(e: any) {
    const searchTerm: string = e.tableSearchString || '';
    this.router.navigate(['/websites', e.website_id], {
        queryParams: { 
          tableSearchTerm: searchTerm,
          fromWSC: this.data.website_service_category_id,
          fromWSCName: this.data.name
         }
    });
  }
}
