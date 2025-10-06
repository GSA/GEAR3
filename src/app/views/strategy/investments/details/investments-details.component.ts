import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Investment } from '@api/models/investments.model';
import { System } from '@api/models/systems.model';
import { Column } from '@common/table-classes';
import { ApiService } from '@services/apis/api.service';
import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';

@Component({
    selector: 'investments-details',
    templateUrl: './investments-details.component.html',
    styleUrls: ['./investments-details.component.scss'],
    standalone: false
})
export class InvestmentsDetailsComponent implements OnInit {

  public inventmentId: number = null;
  public detailsData: Investment;
  public isDataReady: boolean = false;
  public relatedSystems: System[] = [];
  public hasRelatedSystems: boolean = false;

  public isOverviewTabActive: boolean = true;
  public isBudgetYearTabActive: boolean = false;
  public isRelatedSystemsTabActive: boolean = false;

  relatedSystemsTableCols: Column[] = [
    {
      field: 'ID',
      header: 'ID',
      isSortable: true,
      showColumn: false,
    },
    {
      field: 'DisplayName',
      header: 'Alias / Acronym',
      isSortable: true,
    },
    {
      field: 'Name',
      header: 'System Name',
      isSortable: true,
    },
    {
      field: 'Description',
      header: 'Description',
      isSortable: false,
      showColumn: false,
      formatter: this.sharedService.formatDescriptionShorter
    },
    {
      field: 'SystemLevel',
      header: 'System Level',
      isSortable: true,
      showColumn: true
    },
    {
      field: 'Status',
      header: 'Status',
      isSortable: true,
      showColumn: true,
      formatter: this.sharedService.formatStatus
    },
    {
      field: 'RespOrg',
      header: 'Responsible Org',
      isSortable: true,
      showColumn: true
    },
    {
      field: 'BusOrgSymbolAndName',
      header: 'SSO/CXO',
      isSortable: true,
    },
    {
      field: 'BusOrg',
      header: 'Business Org',
      isSortable: true,
      showColumn: true
    },
    {
      field: 'ParentName',
      header: 'Parent System',
      isSortable: true,
      showColumn: false,
    },
    {
      field: 'CSP',
      header: 'Hosting Provider',
      isSortable: true,
      showColumn: false,
    },
    {
      field: 'CloudYN',
      header: 'Cloud Hosted?',
      isSortable: true,
      showColumn: false,
    },
    {
      field: 'ServiceType',
      header: 'Cloud Service Type',
      isSortable: true,
      showColumn: false,
    },
    {
      field: 'AO',
      header: 'Authorizing Official',
      isSortable: true,
      showColumn: false,
      formatter: this.sharedService.pocStringNameFormatter,
    },
    {
      field: 'SO',
      header: 'System Owner',
      isSortable: true,
      showColumn: false,
      formatter: this.sharedService.pocStringNameFormatter,
    },
    {
      field: 'BusPOC',
      header: 'Business POC',
      isSortable: true,
      showColumn: false,
      formatter: this.sharedService.pocStringNameFormatter,
    },
    {
      field: 'TechPOC',
      header: 'Technical POC',
      isSortable: true,
      showColumn: false,
      formatter: this.sharedService.pocStringNameFormatter,
    },
    {
      field: 'DataSteward',
      header: 'Data Steward',
      isSortable: true,
      showColumn: false,
      formatter: this.sharedService.pocStringNameFormatter,
    },
    {
      field: 'FISMASystemIdentifier',
      header: 'FISMA System Identifier',
      isSortable: true,
      showColumn: false
    },
  ];

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private sharedService: SharedService,
    private tableService: TableService
  ) {
  }

  public ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.inventmentId = +params.get('investID');

      // Get Investment details
      this.apiService.getOneInvest(this.inventmentId).subscribe(i => {
        this.detailsData = i;
        this.isDataReady = true;

        this.apiService.getInvestSys(this.inventmentId).subscribe(s => {
          this.relatedSystems = s;
          if(this.relatedSystems.length > 0) {
            this.hasRelatedSystems = true;
            this.tableService.updateReportTableData(this.relatedSystems);
          }
        });
      });
    });
  }

  public onTabClick(tabName: string, event: Event): void {
    event.preventDefault();
    switch (tabName) {
      case 'overview':
        this.isOverviewTabActive = true;
        this.isBudgetYearTabActive = false;
        this.isRelatedSystemsTabActive = false;
        break;
      case 'budget_year':
        this.isOverviewTabActive = false;
        this.isBudgetYearTabActive = true;
        this.isRelatedSystemsTabActive = false;
        break;
      case 'related_systems':
        this.isOverviewTabActive = false;
        this.isBudgetYearTabActive = false;
        this.isRelatedSystemsTabActive = true;
        break;
      default:
        break;
    }
  }

}