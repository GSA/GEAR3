import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { System } from '@api/models/systems.model';
import { TIME } from '@api/models/systime.model';
import { Column } from '@common/table-classes';
import { SystemTimeColumns } from '@common/table-columns/system-time';
import { RelatedCapabilitiesColumns } from '@common/table-columns/related-capabilities';
import { ApiService } from '@services/apis/api.service';
import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';
import { RelatedTechnologiesColumns } from '@common/table-columns/related-technologies';
import { RecordsColumns } from '@common/table-columns/records';
import { WebsitesColumns } from '@common/table-columns/websites';
import { Capability } from '@api/models/capabilities.model';
import { ITStandards } from '@api/models/it-standards.model';
import { Record } from '@api/models/records.model';
import { Website } from '@api/models/websites.model';

@Component({
    selector: 'systems-details',
    templateUrl: './systems-details.component.html',
    styleUrls: ['./systems-details.component.scss'],
    standalone: false
})
export class SystemsDetailsComponent implements OnInit {

  STATUS_STATES = {
    active: 'Active',
    inactive: 'Inactive'
  };

  public systemId: number = null;
  public detailsData: System;
  public isDataReady: boolean = false;
  public systemTimeData: TIME[] = [];
  public sysCapabilitiesData: Capability[] = [];
  public sysTechnologiesData: ITStandards[] = [];
  public sysRecordsData: Record[] = [];
  public sysWebsitesData: Website[] = [];

  public isOverviewTabActive: boolean = true;
  public isBusinessTabActive: boolean = false;
  public isTechnicalTabActive: boolean = false;
  public isRecordsTabActive: boolean = false;
  public isWebsitesTabActive: boolean = false;

  public systemTimeCols: Column[] = SystemTimeColumns;
  public relatedCapabilitiesCols: Column[] = RelatedCapabilitiesColumns;
  public relatedTechnologyCols: Column[] = RelatedTechnologiesColumns;
  public recordsCols: Column[] = RecordsColumns;
  public websiteCols: Column[] = WebsitesColumns;

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private sharedService: SharedService,
    public tableService: TableService
  ) {
  }

  public ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.systemId = +params.get('sysID');

      // Get system details
      this.apiService.getOneSys(this.systemId).subscribe(s => {
        this.detailsData = s;
        this.isDataReady = true;
      });

      this.apiService.getSysTIME(this.systemId).subscribe(sysTime => {
        this.systemTimeData = sysTime;
      });

      this.apiService.getSysCapabilities(this.systemId).subscribe(sysCaps => {
        this.sysCapabilitiesData = sysCaps
      });

      this.apiService.getSysITStandards(this.systemId).subscribe(sysTech => {
        this.sysTechnologiesData = sysTech;
      });

      this.apiService.getRecords().subscribe(sysRecords => {
        this.sysRecordsData = sysRecords;
      });

      this.apiService.getWebsites().subscribe(sysWeb => {
        this.sysWebsitesData = sysWeb;
      });

    });
  }

  public getStatusClass(status: string): string {
    if(status === this.STATUS_STATES.active) {
      return 'status-green';
    } else if(status === this.STATUS_STATES.inactive) {
      return 'status-red';
    } else {
      return 'status-yellow';
    }
  }

  public onTabClick(tabName: string, event: Event): void {
    event.preventDefault();
    switch (tabName) {
      case 'overview':
        this.isOverviewTabActive = true;
        this.isBusinessTabActive = false;
        this.isTechnicalTabActive = false;
        this.isRecordsTabActive = false;
        this.isWebsitesTabActive = false;
        break;
      case 'business':
        this.isOverviewTabActive = false;
        this.isBusinessTabActive = true;
        this.isTechnicalTabActive = false;
        this.isRecordsTabActive = false;
        this.isWebsitesTabActive = false;
        break;
      case 'technical':
        this.isOverviewTabActive = false;
        this.isBusinessTabActive = false;
        this.isTechnicalTabActive = true;
        this.isRecordsTabActive = false;
        this.isWebsitesTabActive = false;
        break;
      case 'records':
        this.isOverviewTabActive = false;
        this.isBusinessTabActive = false;
        this.isTechnicalTabActive = false;
        this.isRecordsTabActive = true;
        this.isWebsitesTabActive = false;
        break;
      case 'websites':
        this.isOverviewTabActive = false;
        this.isBusinessTabActive = false;
        this.isTechnicalTabActive = false;
        this.isRecordsTabActive = false;
        this.isWebsitesTabActive = true;
        break;
      default:
        break;
    }
  }

  public getRelatedArtifacts(): string {
    return this.tableService.renderRelArtifacts(this.detailsData.RelatedArtifacts);
  }

  public getPOCList(): string[] {
    return this.tableService.renderPOCInfoTable(this.detailsData.POC);
  }
}