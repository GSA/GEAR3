import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { System } from '@api/models/systems.model';
import { Column } from '@common/table-classes';
import { ApiService } from '@services/apis/api.service';
import { TableService } from '@services/tables/table.service';
import { Website } from '@api/models/websites.model';
import { WebsiteScan } from '@api/models/website-scan.model';
import { WebsiteServiceCategory } from '@api/models/website-service-category.model';
import { RelatedWebsitesColumns } from '@common/table-columns/related-websites';
import { of } from 'rxjs';
import { RelatedSystemsCols } from '@common/table-columns/related-systems';

@Component({
    selector: 'websites-details',
    templateUrl: './websites-details.component.html',
    styleUrls: ['./websites-details.component.scss'],
    standalone: false
})
export class WebsitesDetailsComponent implements OnInit {
  

  public websiteId: number = null;

  public detailsData: Website;
  public websiteScan: WebsiteScan = null;
  public websiteServiceCategories: WebsiteServiceCategory[] = [];

  public isDataReady: boolean = false;

  public isOverviewTabActive: boolean = true;
  public isRelatedSystemsTabActive: boolean = false;

  public relatedSystemsCols: Column[] = RelatedSystemsCols;
  public relatedSystemsData: System[] = [];

  private IMG_PREFIX: string = '../../../../../assets/website-screenshots/';

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    public tableService: TableService
  ) {
  }

  public ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.websiteId = +params.get('websiteID');

      // Get system details
      this.apiService.getOneWebsite(this.websiteId).subscribe(w => {
        this.detailsData = w;


        this.apiService.getWebsiteScans(this.websiteId).subscribe(ws => {
          this.websiteScan = ws[0];
        });

        this.apiService.getWebsiteServiceCategories(this.websiteId).subscribe((wsc: WebsiteServiceCategory[]) => {
          this.websiteServiceCategories = wsc;
          this.isDataReady = true;
        });
        
      });

      this.apiService.getWebsiteSys(this.websiteId).subscribe(sys => {
        this.relatedSystemsData = sys;
      });
    });
  }

  public onTabClick(tabName: string, event: Event): void {
    event.preventDefault();
    switch (tabName) {
      case 'overview':
        this.isOverviewTabActive = true;
        this.isRelatedSystemsTabActive = false;
        break;
      case 'relatedSystems':
        this.isOverviewTabActive = false;
        this.isRelatedSystemsTabActive = true;
        break;
      default:
        break;
    }
  }

  public inProduction(): boolean {
    return this.detailsData.production_status === 'production';
  }

  public hasScanDate(): boolean {
    return this.websiteScan.scan_date !== '';
  }

  public hasImages(): boolean {
    return (this.websiteScan.desktop_img_file_name !== '' || this.websiteScan.desktop_img_file_name !== null)
     || (this.websiteScan.mobile_img_file_name !== '' || this.websiteScan.mobile_img_file_name !== null);
  }

  public getDesktopImg(): string {
    return this.IMG_PREFIX + this.websiteScan.desktop_img_file_name;
  }

  public getDesktopImgAltText(): string {
    return 'Desktop screenshot of ' + this.detailsData.domain;
  }

  public getMobileImg(): string {
    return this.IMG_PREFIX + this.websiteScan.mobile_img_file_name;
  }

  public getMobileImgAltText(): string {
    return 'Mobile screenshot of ' + this.detailsData.domain;
  }

  public hasServiceCategories(): boolean {
    return this.websiteServiceCategories && this.websiteServiceCategories.length > 0;
  }
}