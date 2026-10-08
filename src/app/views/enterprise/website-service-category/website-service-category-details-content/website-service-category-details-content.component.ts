import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DataDictionary } from '@api/models/data-dictionary.model';
import { Service_Category } from '@api/models/service-category.model';
import { WebsiteServiceCategory } from '@api/models/website-service-category.model';
import { Website } from '@api/models/websites.model';
import { Column } from '@common/table-classes';
import { RelatedWebsitesColumns } from '@common/table-columns/related-websites';
import { ApiService } from '@services/apis/api.service';
import { SharedService } from '@services/shared/shared.service';
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

  public attrDefinitions = <DataDictionary[]>[];
  public websitesAttrDefinitions = <DataDictionary[]>[];

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private sharedService: SharedService,
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

    // Get attribute definitions for the related websites table
    this.apiService.getDataDictionaryByReportName('GSA Websites')
    .subscribe((data: DataDictionary[]) => {
      this.websitesAttrDefinitions = data;
      this.relatedWebsitesTableCols = this.buildRelatedWebsitesCols(data);
  });
  }

  public onRowClick(data: Website): void {
    this.router.navigate(['/websites', data.website_id], {
      queryParams: { fromPrevious: this.data.name }
    });
  }

  public getTooltip (name: string): string {
    return this.sharedService.getTooltip(this.attrDefinitions, name);
  }

  // The Related Websites table uses the 'GSA Websites' data dictionary. Set an
  // explicit titleTooltip on each column using the correct Term for the field
  // (some headers differ from their dictionary Term).
  private buildRelatedWebsitesCols(websitesDefs: DataDictionary[]): Column[] {
    const termByField: { [field: string]: string } = {
      website_id: 'Website Id',
      domain: 'Domain',
      site_owner_email: 'Website Manager',
      office: 'Office',
      sub_office: 'Sub-Office',
      production_status: 'Status'
    };
    return RelatedWebsitesColumns.map(col => {
      const term = termByField[col.field];
      if (term) {
        return { ...col, titleTooltip: this.sharedService.getTooltip(websitesDefs, term) };
      }
      return { ...col };
    });
  }
}
