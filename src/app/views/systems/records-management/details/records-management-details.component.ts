import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '@services/apis/api.service';
import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';
import { PreviousRouteService } from '@services/previous-route/previous-route.service';
import { Record } from '@api/models/records.model';
import { DataDictionary } from '@api/models/data-dictionary.model';
import { System } from '@api/models/systems.model';
import { Column } from '@common/table-classes';
import { RelatedSystemsCols } from '@common/table-columns/related-systems';

@Component({
    selector: 'records-management-details',
    templateUrl: './records-management-details.component.html',
    styleUrls: ['./records-management-details.component.scss'],
    standalone: false
})
export class RecordsManagementDetailsComponent implements OnInit {

  public recordsMgntId: number = null;
  public detailsData: Record;
  public isDataReady: boolean = false;

  public isOverviewTabActive: boolean = true;
  public isRelatedSystemsTabActive: boolean = false;

  public relatedSystemsCols: Column[] = RelatedSystemsCols;
  public relatedSystemsData: System[] = [];

  public attrDefinitions = <DataDictionary[]>[];

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private sharedService: SharedService,
    public tableService: TableService,
    public router: Router,
    private previousRouteService: PreviousRouteService
  ) {
  }

  public ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.recordsMgntId = +params.get('recID');

      // Get system details
      this.apiService.getOneRecord(this.recordsMgntId).subscribe(r => {
        this.detailsData = r;
        this.previousRouteService.setCurrentPageTitle(r.Record_Item_Title);
        this.isDataReady = true;
      });

      this.relatedSystemsData = [];
      this.onTabClick('overview');
      this.apiService.getRecordSys(this.recordsMgntId, true).subscribe(sys => {
        this.relatedSystemsData = sys;
      });

      // Get attribute definition list
      this.apiService.getDataDictionaryByReportName('Records Management')
        .subscribe((data: DataDictionary[]) => {
          this.attrDefinitions = data;
      });

    });
  }

  public getTooltip (name: string): string {
    return this.sharedService.getTooltip(this.attrDefinitions, name);
  }

  public onTabClick(tabName: string, event?: Event): void {
    event?.preventDefault();
    this.isOverviewTabActive = tabName === 'overview';
    this.isRelatedSystemsTabActive = tabName === 'relatedSystems';
  }

  public hasRelatedSystems(): boolean {
    return this.relatedSystemsData?.length > 0;
  }

  public onRelatedSystemsRowClick(data: System): void {
    this.router.navigate(['systems', data.ID], {
      queryParams: { fromPrevious: this.detailsData.Record_Item_Title }
    });
  }

  public editRecord(): void {
    this.router.navigate(['records_mgmt_manager', this.detailsData.Rec_ID]);
  }

  public isLoggedIn(): boolean {
    return this.sharedService.loggedIn;
  }
}
