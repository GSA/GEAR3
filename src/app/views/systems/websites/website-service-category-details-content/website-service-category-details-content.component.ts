import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DataDictionary } from '@api/models/data-dictionary.model';
import { Service_Category } from '@api/models/service-category.model';
import { WebsiteServiceCategory } from '@api/models/website-service-category.model';
import { Website } from '@api/models/websites.model';
import { Column } from '@common/table-classes';
import { RelatedWebsitesColumns } from '@common/table-columns/related-websites';
import { ApiService } from '@services/apis/api.service';
import { TableService } from '@services/tables/table.service';

@Component({
    selector: 'website-service-category-details-content-lite',
    templateUrl: './website-service-category-details-content.component.html',
    styleUrls: ['./website-service-category-details-content.component.scss'],
    standalone: false
})
export class WebsiteServiceCategoryDetailsContentLiteComponent implements OnInit {

  @Input() data: WebsiteServiceCategory;
  @Input() showToolbar: boolean = true;
  @Input() showPagination: boolean = true;
  @Input() websiteName: string;
  public relatedWebsites: Website[] = [];

  public relatedWebsitesTableCols: Column[] = RelatedWebsitesColumns;

  public isDataReady: boolean = false;

  public attrDefinitions = <DataDictionary[]>[];

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

    // Get attribute definition list
    this.apiService.getDataDictionaryByReportName('Website Service Categories')
    .subscribe((data: DataDictionary[]) => {
      this.attrDefinitions = data;
  });
  }

  public onRelatedWebsitesRowClick(data: Website): void {
    this.router.navigate(['websites', data.website_id], {
      queryParams: { fromPrevious: this.websiteName }
    });
  }

  public getTooltip (name: string): string {
    const def = this.attrDefinitions.find(def => def.Term === name);
    if(def){
      return def.TermDefinition;
    }
    return '';
  }
}
