import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Capability } from '@api/models/capabilities.model';
import { DataDictionary } from '@api/models/data-dictionary.model';
import { Organization } from '@api/models/organizations.model';
import { System } from '@api/models/systems.model';
import { Column } from '@common/table-classes';
import { ApiService } from '@services/apis/api.service';
import { SharedService } from '@services/shared/shared.service';
import { PreviousRouteService } from '@services/previous-route/previous-route.service';

@Component({
    selector: 'organizations-details',
    templateUrl: './organizations-details.component.html',
    styleUrls: ['./organizations-details.component.scss'],
    standalone: false
})
export class OrganizationsDetailsComponent implements OnInit {

  public organizationId: string = null;
  public detailsData: Organization;
  public isDataReady: boolean = false;
  public businessSystems: System[] = [];
  public businessCapabilities: Capability[] = [];
  public childOrgs: Organization[] = [];

  public isOverviewTabActive: boolean = true;
  public isBusinessSystemsTabActive: boolean = false;
  public isBusinessCapabilitiesTabActive: boolean = false;
  public isChildOrgsTabActive: boolean = false;

  public attrDefinitions = <DataDictionary[]>[];

  public businessSystemsTableCols: Column[] = [
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
      field: 'BusOrg',
      header: 'Business Org',
      isSortable: true,
      showColumn: true
    },
  ];

  public businessCapabilitiesTableCols: Column[] = [
    {
      field: 'ReferenceNum',
      header: 'Reference #',
      isSortable: true,
    },
    {
      field: 'Name',
      header: 'Capability Name',
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
      field: 'Level',
      header: 'Level',
      isSortable: true,
    },
    {
      field: 'Parent',
      header: 'Parent Capability',
      isSortable: true,
    },
  ];

  public childOrgsTableCols: Column[] = [
    {
      field: 'OrgSymbol',
      header: 'Org Symbol',
      isSortable: true,
    },
    {
      field: 'Name',
      header: 'Organization Name',
      isSortable: true,
    },
    {
      field: 'SSOName',
      header: 'SSO Name',
      isSortable: true,
    },
    {
      field: 'TwoLetterOrgSymbol',
      header: 'Two Letter Org',
      isSortable: true,
    },
    {
      field: 'TwoLetterOrgName',
      header: 'Two Letter Org Name',
      isSortable: true,
    },
  ];

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private sharedService: SharedService,
    private router: Router,
    private previousRouteService: PreviousRouteService
  ) {
  }

  public ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.organizationId = params.get('orgID');

      // Reset to Overview tab on every navigation (including child org clicks)
      this.isOverviewTabActive = true;
      this.isBusinessSystemsTabActive = false;
      this.isBusinessCapabilitiesTabActive = false;
      this.isChildOrgsTabActive = false;
      this.isDataReady = false;
      this.businessSystems = [];
      this.businessCapabilities = [];
      this.childOrgs = [];

      // Get Capability details
      this.apiService.getOneOrg(this.organizationId).subscribe(o => {
        this.detailsData = o;
        this.previousRouteService.setCurrentPageTitle(o.Name);
        this.isDataReady = true;
      });

      // Get Business Systems
      this.apiService.getOrgBusinessSystems(this.organizationId).subscribe(s => {
        this.businessSystems = s;
      });

      // Get Business Capabilities
      this.apiService.getOrgCap(+this.organizationId).subscribe(c => {
        this.businessCapabilities = c;
      });

      // Get Child Organizations
      this.apiService.getOrgChildOrgs(this.organizationId).subscribe(o => {
        this.childOrgs = o;
      });

      // Get attribute definition list
      this.apiService.getDataDictionaryByReportName('Organization')
        .subscribe((data: DataDictionary[]) => {
          this.attrDefinitions = data;
      });
    });
  }

  public getTooltip (name: string): string {
    const def = this.attrDefinitions.find(def => def.Term === name);
    if(def){
      return def.TermDefinition;
    }
    return '';
  }

  public onTabClick(tabName: string, event: Event): void {
    event.preventDefault();
    this.isOverviewTabActive = false;
    this.isBusinessSystemsTabActive = false;
    this.isBusinessCapabilitiesTabActive = false;
    this.isChildOrgsTabActive = false;
    switch (tabName) {
      case 'overview':
        this.isOverviewTabActive = true;
        break;
      case 'business_systems':
        this.isBusinessSystemsTabActive = true;
        break;
      case 'business_capabilities':
        this.isBusinessCapabilitiesTabActive = true;
        break;
      case 'child_orgs':
        this.isChildOrgsTabActive = true;
        break;
      default:
        break;
    }
  }

  public onSystemRowClick(e: System): void {
    this.router.navigate(['/systems', e.ID], {
      queryParams: { fromPrevious: this.detailsData.Name }
    });
  }

  public onCapabilityRowClick(e: Capability): void {
    this.router.navigate(['/capabilities', e.ID], {
      queryParams: { fromPrevious: this.detailsData.Name }
    });
  }

  public onOrgRowClick(e: Organization): void {
    this.router.navigate(['/organizations', e.ID], {
      queryParams: { fromPrevious: this.detailsData.Name }
    });
  }

}
