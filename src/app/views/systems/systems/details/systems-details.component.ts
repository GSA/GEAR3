import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
import { forkJoin } from 'rxjs';

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

  public splitPOCs: any = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private sharedService: SharedService,
    public tableService: TableService
  ) {
  }

  public ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.systemId = +params.get('sysID');

      forkJoin([
        this.apiService.getOneSys(this.systemId),
        this.apiService.getPOCsBySystemId(this.systemId),
        this.apiService.getSysTIME(this.systemId),
        this.apiService.getSysCapabilities(this.systemId),
        this.apiService.getSysITStandards(this.systemId),
        this.apiService.getSysRecords(this.systemId),
        this.apiService.getRecords(),
        this.apiService.getSysWebsites(this.systemId),
        this.apiService.getWebsites()
      ]).subscribe(
        ([
          system,
          systemPOCs,
          systemTIME,
          systemCapabilities,
          systemITStandard,
          systemRecords,
          records,
          systemWebsites,
          websites
        ]) => {
          this.detailsData = system;




          this.systemTimeData = systemTIME;
          this.sysCapabilitiesData = systemCapabilities;
          this.sysTechnologiesData = systemITStandard;

          const recordIds = new Set(systemRecords.map(({ obj_records_Id }) => obj_records_Id));
          this.sysRecordsData = records.filter(({ Rec_ID }) => recordIds.has(Rec_ID));

          const websiteIds = new Set(systemWebsites.map(({ obj_websites_Id }) => obj_websites_Id));
          this.sysWebsitesData = websites.filter(({ website_id }) => websiteIds.has(parseInt(website_id)));

          this.splitPOCs = this.splitPOCInfo(this.detailsData.POC);

          this.isDataReady = true;
        });

      // this.apiService.getOneSys(this.systemId).subscribe(s => {
      //   this.detailsData = s;
      //   this.isDataReady = true;
      // });

      // this.apiService.getSysTIME(this.systemId).subscribe(sysTime => {
      //   this.systemTimeData = sysTime;
      // });

      // this.apiService.getSysCapabilities(this.systemId).subscribe(sysCaps => {
      //   this.sysCapabilitiesData = sysCaps
      // });

      // this.apiService.getSysITStandards(this.systemId).subscribe(sysTech => {
      //   this.sysTechnologiesData = sysTech;
      // });

      // this.apiService.getSysRecords(this.systemId).subscribe((mappings: any[]) => {
      //   this.apiService.getRecords().subscribe((records: any[]) => {
      //     const recordIds = new Set(mappings.map(({ obj_records_Id }) => obj_records_Id));
      //     this.sysRecordsData = records.filter(({ Rec_ID }) => recordIds.has(parseInt(Rec_ID)));
      //   });
      // });

      // this.apiService.getSysWebsites(this.systemId).subscribe((mappings: any[]) => {
      //   this.apiService.getWebsites().subscribe((websites: any[]) => {
      //     const websiteIds = new Set(mappings.map(({ obj_websites_Id }) => obj_websites_Id));
      //     this.sysWebsitesData = websites.filter(({ website_id }) => websiteIds.has(parseInt(website_id)));
      //   });
      // });

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

  // public getPOCList(): any[] {
  //   return this.tableService.renderPOCInfoTable(this.detailsData.POC);
  // }

  public getTimeQuestionnaireButtonText(): string {
    const currentMonth = new Date().getMonth() + 1;
    let fyYear = '';
    if(currentMonth >= 10) {
      fyYear = (new Date().getFullYear() + 1).toString().slice(-2);
    } else {
      fyYear = (new Date().getFullYear()).toString().slice(-2);
    }
    return `Complete your system's TIME lifecycle questionnaire for FY${fyYear}`;
  }

  public onTimeButtonClick(): void {
    window.open(this.detailsData.TIME_URL, '_blank');
  }

  private splitPOCInfo(p) {
    let poc = null;
    let poc1 = null;
    let pocs = [];

    if (p) {
      poc1 = p.split('*');
      poc1 = poc1.map((poctype, tmpObj) => {
        poctype = poctype.split(':');
        poc = poctype[1].split('; ');
        for (var i = 0; i < poc.length; i++) {
          var pieces = poc[i].split(',');
          tmpObj = null;
          let orgCode = '';
          let orgName = '';
          if (pieces[0] !== ''){
            //if(pieces[1] !== '') {
              this.apiService.getPOCOrgByEmail(pieces[1]).subscribe(pocOrg => {
                orgCode = pocOrg[0].OrgSymbol;
                orgName = pocOrg[0].DisplayName;

                tmpObj = {
                  type: poctype[0],
                  name: pieces[0],
                  phone: pieces[2],
                  email: pieces[1],
                  orgCode: orgCode,
                  orgName: orgName
                };
                pocs.push(tmpObj);
              });
            // } else {
            //   tmpObj = {
            //     type: poctype[0],
            //     name: pieces[0],
            //     phone: pieces[2],
            //     email: pieces[1],
            //     orgCode: orgCode,
            //     orgName: orgName
            //   };
            // }
          }
          
        }
      });
    }

    return pocs.filter(function (el) {
      return el != null;
    });
  }

}