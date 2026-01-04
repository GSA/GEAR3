import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Capability } from '@api/models/capabilities.model';
import { Investment } from '@api/models/investments.model';
import { Organization } from '@api/models/organizations.model';
import { System } from '@api/models/systems.model';
import { Column } from '@common/table-classes';
import { ApiService } from '@services/apis/api.service';
import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';

@Component({
    selector: 'capabilities-details',
    templateUrl: './capabilities-details.component.html',
    styleUrls: ['./capabilities-details.component.scss'],
    standalone: false
})
export class CapabilitiesDetailsComponent implements OnInit {

  public capabilityId: number = null;
  public detailsData: Capability;
  public isDataReady: boolean = false;
  public relatedOrganization: Organization[] = [];
  public supportingSystems: System[] = [];
  public hasRelatedOrganizations: boolean = false;
  public hasSupportingSystems: boolean = false;

  public isOverviewTabActive: boolean = true;
  public isRelatedOrganizationsTabActive: boolean = false;
  public isSupportingSystemsTabActive: boolean = false;

  public relatedOrgsTableCols: Column[] = [
    {
      field: 'OrgSymbol',
      header: 'Org Symbol',
      isSortable: true
    }, 
    {
      field: 'Name',
      header: 'Organization Name',
      isSortable: true
    }, 
    {
      field: 'SSOName',
      header: 'SSO Name',
      isSortable: true
    }, 
    {
      field: 'TwoLetterOrgSymbol',
      header: 'Two Letter Org',
      isSortable: true
    }, 
    {
      field: 'TwoLetterOrgName',
      header: 'Two Letter Org Name',
      isSortable: true,
      formatter: this.sharedService.formatDescription
    }
  ];

  public supportingSystemsTableCols: Column[] = [
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
    }
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
      this.capabilityId = +params.get('capID');

      // Get Capability details
      this.apiService.getOneCap(this.capabilityId).subscribe(i => {
        this.detailsData = i;
        this.isDataReady = true;
      });

      // Get Related Orgs
      this.apiService.getCapOrgs(this.capabilityId).subscribe(o => {
        this.relatedOrganization = o;
        if(o.length > 0) {
          this.hasRelatedOrganizations = true;
        }
      });

      // Get Supporting Systems
      this.apiService.getCapSystems(this.capabilityId).subscribe(s => {
        this.supportingSystems = s;
        if(s.length > 0) {
          this.hasSupportingSystems = true;
        }
      });
    });
  }

  public onTabClick(tabName: string, event: Event): void {
    event.preventDefault();
    switch (tabName) {
      case 'overview':
        this.isOverviewTabActive = true;
        this.isRelatedOrganizationsTabActive = false;
        this.isSupportingSystemsTabActive = false;
        break;
      case 'related_organizations':
        this.isOverviewTabActive = false;
        this.isRelatedOrganizationsTabActive = true;
        this.isSupportingSystemsTabActive = false;
        this.tableService.updateReportTableData(this.relatedOrganization);
        break;
      case 'supporting_systems':
        this.isOverviewTabActive = false;
        this.isRelatedOrganizationsTabActive = false;
        this.isSupportingSystemsTabActive = true;
        this.tableService.updateReportTableData(this.supportingSystems);
        break;
      default:
        break;
    }
  }

  public editCapability(): void {
    this.router.navigate(['capabilities_manager', this.detailsData.ID]);
  }

  public isLoggedIn(): boolean {
    return this.sharedService.loggedIn;
  }

}