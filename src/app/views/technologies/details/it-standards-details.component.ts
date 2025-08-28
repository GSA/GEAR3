import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DataDictionary } from '@api/models/data-dictionary.model';
import { AppBundle } from '@api/models/it-standards-app-bundle.model';
import { ITStandards } from '@api/models/it-standards.model';
import { System } from '@api/models/systems.model';
import { Column } from '@common/table-classes';
import { ApiService } from '@services/apis/api.service';
import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';

@Component({
    selector: 'it-standards',
    templateUrl: './it-standards-details.component.html',
    styleUrls: ['./it-standards-details.component.scss'],
    standalone: false
})
export class ItStandardsDetailsComponent implements OnInit {

  STATUS_STATES = {
    approved: 'Approved',
    pilot: 'Pilot',
    propsed: 'Proposed',
    retired: 'Retired',
    denied: 'Denied',
    expired: 'Expired'
  };

  COMPLIANCE_STATES = {
    fullyCompliant: 'Fully Compliant',
    complianceUnknown: 'Compliance Unknown',
    partiallyCompliant: 'Partially Compliant',
    notCompliant: 'Not Compliant'
  };

  DEPLOYMENT_TYPES = {
    desktop: 'Desktop',
    mobile: 'Mobile',
    server: 'Server'
  };

  public itStandardId: number = null;
  public detailsData: ITStandards;
  public showAllFields: boolean = false;
  public attrDefinitions = <DataDictionary[]>[];
  public isDataReady: boolean = false;
  public relatedSystems: System[] = [];
  public hasRelatedSystems: boolean = false;

  public isOverviewTabActive: boolean = true;
  public isSystemsTabActive: boolean = false;

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
      isSortable: true,
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
    private tableService: TableService,
    private router: Router
  ) {
  }

  public ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.itStandardId = +params.get('standardID');

      // Get IT standard details
      this.apiService.getOneITStandard(this.itStandardId).subscribe(s => {
        this.detailsData = s;
        this.isDataReady = true;

        // Get systems using this standard
        this.apiService.getITStandardsRelatedSystems(s.ID).subscribe(sys => {
          this.relatedSystems = sys;
          if(this.relatedSystems.length > 0) {
            this.hasRelatedSystems = true;
            this.tableService.updateReportTableData(this.relatedSystems);
          }
        });
      });

      // Get attribute definition list
      this.apiService.getDataDictionaryByReportName('IT Standards List')
        .subscribe((data: DataDictionary[]) => {
          this.attrDefinitions = data;
      });
    });
  }

  public getStatusClass(status: string): string {
    if(status === this.STATUS_STATES.approved) {
      return 'status-green';
    } else if(status === this.STATUS_STATES.denied || status === this.STATUS_STATES.expired || status === this.STATUS_STATES.retired) {
      return 'status-red';
    } else {
      return 'status-yellow';
    }
  }

  public getDateStatusCircle(date: Date): string {
    const today = new Date();
    const currentYear = new Date().getFullYear();
    let expDate = new Date(date);

    if(expDate > today && expDate.getFullYear() !== currentYear) {
      return 'circle-green';
    } else if(expDate < today) {
      return 'circle-red';
    } else {
      return 'circle-yellow';
    }
  }

  public getComplianceStatusCircle(compliance: string) {
    if(compliance === this.COMPLIANCE_STATES.fullyCompliant) {
      return 'circle-green';
    }

    if(compliance === this.COMPLIANCE_STATES.complianceUnknown || compliance === this.COMPLIANCE_STATES.partiallyCompliant) {
      return 'circle-yellow';
    }

    if(compliance === this.COMPLIANCE_STATES.notCompliant) {
      return 'circle-red';
    }
  }

  public getDeploymentTypeIcon(deployementType: string) : string {
    if(deployementType === this.DEPLOYMENT_TYPES.desktop) {
      return 'fas fa-desktop';
    } else if (deployementType === this.DEPLOYMENT_TYPES.mobile) {
      return 'fas fa-mobile-alt';
    } else if (deployementType === this.DEPLOYMENT_TYPES.server) {
      return 'fas fa-server';
    } else {
      return 'fas fa-keyboard';
    }
  }

  public getYesNoValue(value: string): string {
    if(value === 'T') {
      return 'Yes';
    } else if(value === 'F') {
      return 'No';
    } else {
      return 'N/A';
    }
  }

  public renderAppBundleList(appBundle: any): string {
    let list = 'None';
    if(appBundle) {
      list = '<ul>';
      let ids = appBundle.split(', ');
      ids.forEach(a => {
        list += `<li>${a}</li>`;
      });
      list += '</ul>';
    }
    return list;
  }

  public isFieldPopulated(field: any) {
    return (field && field !== '' && field !== 'N/A' && field !== null && field !== 'null') || this.showAllFields;
  }

  public toggleShowAllFields(): void {
    this.showAllFields = !this.showAllFields;
  }

  public getShowAllFieldsButtonText(): string {
    if(this.showAllFields) {
      return 'Hide Empty Fields';
    } else {
      return 'Show All Fields';
    }
  }

  public getTooltip (name: string): string {
    const def = this.attrDefinitions.find(def => def.Term === name);
    if(def){
      return def.TermDefinition;
    }
    return '';
  }

  public isApproved(): boolean {
    return this.detailsData.Status === this.STATUS_STATES.approved;
  }

  public onTabClick(tabName: string): void {
    switch (tabName) {
      case 'overview':
        this.isOverviewTabActive = true;
        this.isSystemsTabActive = false;
        break;
      case 'systems':
        this.isOverviewTabActive = false;
        this.isSystemsTabActive = true;
        break;
      default:
        break;
    }
  }

  public editITStandard(): void {
    this.router.navigate(['it_standards_manager', this.detailsData.ID]);
  }

}
