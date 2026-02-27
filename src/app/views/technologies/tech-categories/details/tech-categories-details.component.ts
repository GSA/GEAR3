import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ITStandards } from '@api/models/it-standards.model';
import { TRM } from '@api/models/trm.model';
import { Column } from '@common/table-classes';
import { RelatedTechnologiesColumns } from '@common/table-columns/related-technologies';
import { ApiService } from '@services/apis/api.service';
import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';
import { forkJoin } from 'rxjs';

@Component({
    selector: 'tech-categories-details',
    templateUrl: './tech-categories-details.component.html',
    styleUrls: ['./tech-categories-details.component.scss'],
    standalone: false
})
export class TechCategoriesDetailsComponent implements OnInit {

  public trmId: number = null;
  public detailsData: TRM;
  public isDataReady: boolean = false;
  public relatedITStandards: ITStandards[] = [];

  public relatedITStandardsTableCols: Column[] = [];

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private sharedService: SharedService,
    private tableService: TableService,
    private router: Router
  ) {
  }

  public ngOnInit(): void {
    this.apiService.getDataDictionaryByReportName('IT Standards List').subscribe(defs => {

      // IT Standard Table Columns
      this.relatedITStandardsTableCols = [{
        field: 'ID',
        header: 'Id',
        isSortable: true,
        showColumn: false,
        titleTooltip: this.sharedService.getTooltip(defs, 'ID')
      }, {
        field: 'Name',
        header: 'IT Standard Name',
        isSortable: true,
        showColumn: true,
        titleTooltip: this.sharedService.getTooltip(defs, 'IT Standard Name')
      },
      {
        field: 'ApprovedVersions',
        header: 'Approved Versions',
        isSortable: false,
        showColumn: true,
        titleTooltip: this.sharedService.getTooltip(defs, 'Approved Versions')
      }, {
        field: 'Manufacturer',
        header: 'Manufacturer ID',
        isSortable: true,
        showColumn: false,
        titleTooltip: this.sharedService.getTooltip(defs, 'Manufacturer ID')
      }, {
        field: 'ManufacturerName',
        header: 'Manufacturer',
        isSortable: true,
        titleTooltip: this.sharedService.getTooltip(defs, 'Manufacturer Name')
      }, {
        field: 'SoftwareProduct',
        header: 'Product ID',
        isSortable: true,
        showColumn: false,
        titleTooltip: this.sharedService.getTooltip(defs, 'Software Product ID')
      }, {
        field: 'SoftwareProductName',
        header: 'Product',
        isSortable: true,
        showColumn: false,
        titleTooltip: this.sharedService.getTooltip(defs, 'Software Product Name')
      }, {
        field: 'SoftwareVersion',
        header: 'Version ID',
        isSortable: true,
        showColumn: false,
        titleTooltip: this.sharedService.getTooltip(defs, 'Software Version ID')
      }, {
        field: 'SoftwareVersionName',
        header: 'Version',
        isSortable: true,
        showColumn: false,
        titleTooltip: this.sharedService.getTooltip(defs, 'Software Version Name')
      }, {
        field: 'SoftwareRelease',
        header: 'Release ID',
        isSortable: true,
        showColumn: false,
        titleTooltip: this.sharedService.getTooltip(defs, 'Software Release ID')
      }, {
        field: 'SoftwareReleaseName',
        header: 'Release',
        isSortable: true,
        showColumn: false,
        titleTooltip: this.sharedService.getTooltip(defs, 'Software Release Name')
      }, {
        field: 'EndOfLifeDate',
        header: 'Vendor End of Life Date',
        isSortable: true,
        showColumn: false,
        formatter: this.sharedService.dateFormatter,
       titleTooltip: this.sharedService.getTooltip(defs, 'Software End of Life Date')
      }, {
        field: 'AlsoKnownAs',
        header: 'Also Known As',
        isSortable: true,
        showColumn: false,
        titleTooltip: this.sharedService.getTooltip(defs, 'Previously Known As')
      }, {
        field: 'Description',
        header: 'Description',
        isSortable: true,
        showColumn: true,
        formatter: this.sharedService.formatDescriptionLite,
        titleTooltip: this.sharedService.getTooltip(defs, 'Description')
      }, {
        field: 'Status',
        header: 'Status',
        isSortable: true,
        formatter: this.sharedService.formatStatus,
        titleTooltip: this.sharedService.getTooltip(defs, 'Status')
      }, {
        field: 'StandardType',
        header: 'Standard Type',
        isSortable: true,
        showColumn: false,
        titleTooltip: this.sharedService.getTooltip(defs, 'Standard Type')
      }, {
        field: 'DeploymentType',
        header: 'Deployment Type',
        isSortable: true,
        formatter: this.sharedService.formatDeploymentType,
        titleTooltip: this.sharedService.getTooltip(defs, 'Deployment Type')
      }, {
        field: 'ComplianceStatus',
        header: '508 Compliance',
        isSortable: true,
        showColumn: false,
        titleTooltip: this.sharedService.getTooltip(defs, '508 Compliance')
      }, {
        field: 'POC',
        header: 'POC',
        isSortable: true,
        showColumn: false,
        titleTooltip: this.sharedService.getTooltip(defs, 'POC')
      }, {
        field: 'POCorg',
        header: 'POC Org',
        isSortable: true,
        showColumn: false,
        titleTooltip: this.sharedService.getTooltip(defs, 'POC Org')
      },
      {
        field: 'Comments',
        header: 'Comments',
        isSortable: true,
        showColumn: false,
        formatter: this.sharedService.formatDescription,
        titleTooltip: this.sharedService.getTooltip(defs, 'Comments')
      }, {
        field: 'attestation_required',
        header: 'Attestation Required',
        isSortable: true,
        showColumn: false,
        titleTooltip: this.sharedService.getTooltip(defs, 'Attestation Required')
      }, {
        field: 'attestation_link',
        header: 'Attestation Link',
        isSortable: true,
        showColumn: false,
        titleTooltip: this.sharedService.getTooltip(defs, 'Attestation Link')
      }, {
        field: 'fedramp',
        header: 'FedRAMP',
        isSortable: true,
        showColumn: false,
        formatter: this.YesNo,
        titleTooltip: this.sharedService.getTooltip(defs, 'FedRAMP')
      }, {
        field: 'open_source',
        header: 'Open Source',
        isSortable: true,
        showColumn: false,
        formatter: this.YesNo,
        titleTooltip: this.sharedService.getTooltip(defs, 'Open Source')
      },{
        field: 'RITM',
        header: 'Requested Item (RITM)',
        isSortable: true,
        showColumn: false,
        titleTooltip: this.sharedService.getTooltip(defs, 'Requested Item (RITM)')
      }, {
        field: 'ApprovalExpirationDate',
        header: 'Approval Expires',
        isSortable: true,
        showColumn: true,
        formatter: this.sharedService.dateFormatter,
        titleTooltip: this.sharedService.getTooltip(defs, 'Approval Expiration Date')
      },
      {
        field: 'OperatingSystems',
        header: 'Operating Systems',
        isSortable: false,
        showColumn: false,
        formatter: this.sharedService.csvFormatter,
        titleTooltip: this.sharedService.getTooltip(defs, 'Operating Systems')
      },
      {
        field: 'AppBundleIds',
        header: 'App Bundle Ids',
        isSortable: false,
        showColumn: false,
        formatter: this.sharedService.csvFormatter,
        titleTooltip: this.sharedService.getTooltip(defs, 'App Bundle Ids')
      },
      {
        field: 'ConditionsRestrictions',
        header: 'Conditions/Restrictions',
        isSortable: false,
        showColumn: false,
        titleTooltip: this.sharedService.getTooltip(defs, 'ConditionsRestrictions')
      }];
    });


    this.route.paramMap.subscribe(params => {
      this.trmId = +params.get('techCatID');

      forkJoin([
        this.apiService.getSingleTRM(this.trmId),
        this.apiService.getTRMRelatedITStandards(this.trmId),
      ]).subscribe(
      ([
        trm,
        relatedTech,
      ]) => {
        this.detailsData = trm;
        this.relatedITStandards = relatedTech;
        this.isDataReady = true;
      });
    });
  }

  public hasRelatedTech(): boolean {
    return this.relatedITStandards && this.relatedITStandards.length > 0;
  }

  public onRowClick(e: any): void {
    this.router.navigate(['/it_standards', e.ID], {
      queryParams: { fromPrevious: this.detailsData.Name }
    });
  }

  private YesNo(value, row, index, field): string {
    return value === 'T'? "Yes" : "No";
  }
}