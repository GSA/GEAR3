import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ApiService } from '@services/apis/api.service';
import { SharedService } from '@services/shared/shared.service';

import { ITStandards } from '@api/models/it-standards.model';
import { DataDictionary } from '@api/models/data-dictionary.model';
import { Column } from '@common/table-classes';

@Component({
    selector: 'it-standard-rollup',
    templateUrl: './it-standard-rollup.component.html',
    styleUrls: ['./it-standard-rollup.component.scss'],
    standalone: false
})
export class ItStandardRollupComponent implements OnInit {

  STATUS_STATES = {
    approved: 'Approved',
    pilot: 'Pilot',
    proposed: 'Proposed',
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

  productKey: string = '';
  productName: string = '';
  detailsData: ITStandards = null;
  allVersions: ITStandards[] = [];
  isDataReady: boolean = false;
  showAllFields: boolean = false;
  attrDefinitions: DataDictionary[] = [];

  isOverviewTabActive: boolean = true;

  versionsTableCols: Column[] = [
    { field: 'SoftwareReleaseName', header: 'Release',          isSortable: true },
    { field: 'Name',                header: 'Standard Name',    isSortable: true },
    { field: 'Status',              header: 'Status',           isSortable: true, formatter: this.sharedService.formatStatus },
    { field: 'DeploymentType',      header: 'Deployment Type',  isSortable: true, formatter: this.sharedService.formatDeploymentType },
    { field: 'ApprovalExpirationDate', header: 'Approval Expires', isSortable: true, formatter: this.sharedService.dateFormatter },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    public sharedService: SharedService,
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.productKey = params.get('productKey') || '';

      this.apiService.getDataDictionaryByReportName('IT Standards List').subscribe(defs => {
        this.attrDefinitions = defs;
      });

      this.apiService.getITStandards().subscribe(standards => {
        const withConditions = this.applyConditionStatus(standards);

        let versions: ITStandards[];
        if (this.productKey.startsWith('p')) {
          const productStr = this.productKey.substring(1);
          versions = withConditions.filter(s => s.SoftwareProduct === productStr);
        } else {
          const standardId = Number(this.productKey.substring(1));
          versions = withConditions.filter(s => s.ID === standardId);
        }

        if (versions.length === 0) {
          this.router.navigate(['/it_standards']);
          return;
        }

        this.detailsData = this.getMostRecentVersion(versions);
        this.productName = this.detailsData.SoftwareProductName || this.detailsData.Name;
        this.allVersions = this.sortVersions(versions);
        this.isDataReady = true;
      });
    });
  }

  private applyConditionStatus(standards: ITStandards[]): ITStandards[] {
    return standards.map(s => ({
      ...s,
      Status: (s.ConditionsRestrictions && s.ConditionsRestrictions.length > 0)
        ? 'Approved with conditions'
        : s.Status
    }));
  }

  private getMostRecentVersion(versions: ITStandards[]): ITStandards {
    const withDate = versions.filter(v => v.ApprovalExpirationDate);
    if (withDate.length > 0) {
      return withDate.sort((a, b) =>
        new Date(b.ApprovalExpirationDate).getTime() - new Date(a.ApprovalExpirationDate).getTime()
      )[0];
    }
    return [...versions].sort((a, b) => b.ID - a.ID)[0];
  }

  private sortVersions(versions: ITStandards[]): ITStandards[] {
    const priority = (s: string): number => {
      if (s === 'Approved' || s === 'Approved with conditions') return 0;
      if (s === 'Denied') return 1;
      if (s === 'Retired') return 2;
      return 3;
    };
    return [...versions].sort((a, b) => {
      const p = priority(a.Status) - priority(b.Status);
      if (p !== 0) return p;
      if (a.ApprovalExpirationDate && b.ApprovalExpirationDate) {
        return new Date(b.ApprovalExpirationDate).getTime() - new Date(a.ApprovalExpirationDate).getTime();
      }
      return b.ID - a.ID;
    });
  }

  getStatusClass(status: string): string {
    if (status === this.STATUS_STATES.approved) return 'status-green';
    if (status === this.STATUS_STATES.denied || status === this.STATUS_STATES.expired || status === this.STATUS_STATES.retired) return 'status-red';
    return 'status-yellow';
  }

  getDateStatusCircle(date: any): string {
    const today = new Date();
    const currentYear = today.getFullYear();
    const expDate = new Date(date);
    if (expDate > today && expDate.getFullYear() !== currentYear) return 'circle-green';
    if (expDate < today) return 'circle-red';
    return 'circle-yellow';
  }

  getComplianceStatusCircle(compliance: string): string {
    if (compliance === this.COMPLIANCE_STATES.fullyCompliant) return 'circle-green';
    if (compliance === this.COMPLIANCE_STATES.complianceUnknown || compliance === this.COMPLIANCE_STATES.partiallyCompliant) return 'circle-yellow';
    if (compliance === this.COMPLIANCE_STATES.notCompliant) return 'circle-red';
    return '';
  }

  getDeploymentTypeIcon(deploymentType: string): string {
    if (deploymentType === this.DEPLOYMENT_TYPES.desktop) return 'fas fa-desktop';
    if (deploymentType === this.DEPLOYMENT_TYPES.mobile) return 'fas fa-mobile-alt';
    if (deploymentType === this.DEPLOYMENT_TYPES.server) return 'fas fa-server';
    return 'fas fa-keyboard';
  }

  getYesNoValue(value: string): string {
    if (value === 'T') return 'Yes';
    if (value === 'F') return 'No';
    return 'N/A';
  }

  renderAppBundleList(appBundle: any): string {
    if (!appBundle) return 'None';
    const ids: string[] = appBundle.split(', ');
    return '<ul>' + ids.map((a: string) => `<li>${a}</li>`).join('') + '</ul>';
  }

  isFieldPopulated(field: any): boolean {
    return (field != null && field !== '' && field !== 'N/A' && field !== 'null') || this.showAllFields;
  }

  toggleShowAllFields(): void {
    this.showAllFields = !this.showAllFields;
  }

  getShowAllFieldsButtonText(): string {
    return this.showAllFields ? 'Hide Empty Fields' : 'Show All Fields';
  }

  getTooltip(name: string): string {
    const def = this.attrDefinitions.find(d => d.Term === name);
    return def ? def.TermDefinition : '';
  }

  isApproved(): boolean {
    return this.detailsData?.Status === this.STATUS_STATES.approved;
  }

  isApprovedWithConditions(): boolean {
    return this.detailsData?.Status === 'Approved with conditions' ||
      (this.detailsData?.Status === 'Approved' && this.detailsData?.ConditionsRestrictions?.length > 0);
  }

  getConditionsRestrictionsClass(): string {
    return (this.detailsData?.ConditionsRestrictions?.length > 0) ? 'condition-restriction' : '';
  }

  onVersionRowClick(standard: ITStandards): void {
    this.router.navigate(['/it_standards', standard.ID]);
  }

  navigateBack(): void {
    this.router.navigate(['/it_standards']);
  }

  isLoggedIn(): boolean {
    return this.sharedService.loggedIn;
  }

  editITStandard(): void {
    this.router.navigate(['it_standards_manager', this.detailsData.ID]);
  }
}
