import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ApiService } from '@services/apis/api.service';
import { SharedService } from '@services/shared/shared.service';

import { ITStandards } from '@api/models/it-standards.model';
import { DataDictionary } from '@api/models/data-dictionary.model';

export interface RollupCol {
  field: string;
  header: string;
  isSortable: boolean;
  showColumn: boolean;
}

export interface ItStandardRollupRow {
  productKey: string;
  displayName: string;
  manufacturerName: string;
  status: string;
  deploymentType: string;
  description: string;
  approvalExpirationDate: any;
  alsoKnownAs: string;
  standardType: string;
  versionsCount: number;
  hasMultipleVersions: boolean;
  mostRecentStandard: ITStandards;
  versions: ITStandards[];
}

@Component({
    selector: 'it-standards',
    templateUrl: './it-standards.component.html',
    styleUrls: ['./it-standards.component.scss'],
    standalone: false
})
export class ItStandardsComponent implements OnInit {

  private readonly otherStatuses = ['Approved', 'Denied', 'Retired', 'Approved with conditions'];

  attrDefinitions: DataDictionary[] = [];
  itStandardsData: ITStandards[] = [];

  rollupRows: ItStandardRollupRow[] = [];
  rollupRowsFiltered: ItStandardRollupRow[] = [];
  rollupTotals: any = null;
  isRollupReady: boolean = false;

  selectedTab: string = 'All';
  filterChips: string[] = ['Mobile', 'Desktop', 'Server', 'SaaS', 'PaaS', 'Other'];
  private selectedChips: string[] = [];

  searchTerm: string = '';
  expandedRows: { [key: string]: boolean } = {};

  rollupCols: RollupCol[] = [
    { field: 'displayName',           header: 'IT Standard Name', isSortable: true,  showColumn: true  },
    { field: 'versionsCount',         header: 'Versions',         isSortable: true,  showColumn: true  },
    { field: 'manufacturerName',      header: 'Manufacturer',     isSortable: true,  showColumn: true  },
    { field: 'description',           header: 'Description',      isSortable: false, showColumn: true  },
    { field: 'status',                header: 'Status',           isSortable: true,  showColumn: true  },
    { field: 'deploymentType',        header: 'Deployment Type',  isSortable: true,  showColumn: true  },
    { field: 'approvalExpirationDate', header: 'Approval Expires', isSortable: true, showColumn: true  },
    { field: 'alsoKnownAs',           header: 'Also Known As',    isSortable: true,  showColumn: false },
    { field: 'standardType',          header: 'Standard Type',    isSortable: true,  showColumn: false },
  ];

  selectedCols: RollupCol[] = [];

  daysExpiring: number = 0;
  daysRetired: number = 0;
  includePastDueExpirations: boolean = false;
  pastDueOnly: boolean = false;

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    public sharedService: SharedService,
    private router: Router
  ) {}

  get visibleCols(): RollupCol[] {
    return this.rollupCols.filter(c => c.showColumn);
  }

  isLoggedIn(): boolean {
    return this.sharedService.loggedIn;
  }

  onCreateNew(): void {
    this.router.navigate(['/it_standards_manager']);
  }

  ngOnInit(): void {
    this.selectedCols = this.rollupCols.filter(c => c.showColumn);

    this.route.queryParams.subscribe(params => {
      if (params['tab'])               this.selectedTab = params['tab'];
      if (params['expiringWithinDays']) this.daysExpiring = +params['expiringWithinDays'];
      if (params['includePastDue'])    this.includePastDueExpirations = params['includePastDue'] === 'true';
      if (params['pastDueOnly'])       this.pastDueOnly = params['pastDueOnly'] === 'true';
      if (params['retiredWithinDays']) this.daysRetired = +params['retiredWithinDays'];
      if (params['tableSearchTerm'])   this.searchTerm = params['tableSearchTerm'];
    });

    this.apiService.getDataDictionaryByReportName('IT Standards List').subscribe(defs => {
      this.attrDefinitions = defs;
    });

    this.sharedService.setJWTonLogIn();

    this.apiService.getITStandards().subscribe(standards => {
      this.itStandardsData = this.applyConditionStatus(standards);
      const filtered = this.applyDateFilters(this.itStandardsData);
      this.rollupRows = this.buildRollupRows(filtered);
      this.applyRollupFilters();
      this.isRollupReady = true;
    });
  }

  private applyDateFilters(standards: ITStandards[]): ITStandards[] {
    const p = this.route.snapshot.queryParams;
    const daysExpiring = Number(p['expiringWithinDays'] || this.daysExpiring || 0);
    const daysRetired = Number(p['retiredWithinDays'] || this.daysRetired || 0);
    const includePastDue = p['includePastDue'] === 'true' || this.includePastDueExpirations;
    const pastDueOnly = p['pastDueOnly'] === 'true' || this.pastDueOnly;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (daysExpiring > 0) {
      const until = new Date(now);
      until.setDate(until.getDate() + daysExpiring);
      return standards.filter(x => {
        if (!x.ApprovalExpirationDate) return false;
        const d = new Date(x.ApprovalExpirationDate);
        d.setHours(0, 0, 0, 0);
        const inWindow = includePastDue ? d <= until : (d >= now && d <= until);
        return inWindow && this.isInExpiringStatusScope(x);
      });
    } else if (pastDueOnly) {
      return standards.filter(x => {
        if (!x.ApprovalExpirationDate) return false;
        const d = new Date(x.ApprovalExpirationDate);
        d.setHours(0, 0, 0, 0);
        return d < now && this.isInExpiringStatusScope(x);
      });
    } else if (daysRetired > 0) {
      const since = new Date(now);
      since.setDate(since.getDate() - daysRetired);
      return standards.filter(x => {
        if (!x.ApprovalExpirationDate) return false;
        const d = new Date(x.ApprovalExpirationDate);
        d.setHours(0, 0, 0, 0);
        return d <= now && d >= since && x.Status === 'Retired';
      });
    }

    return standards;
  }

  private buildRollupRows(standards: ITStandards[]): ItStandardRollupRow[] {
    const groups = new Map<string, ITStandards[]>();

    for (const std of standards) {
      const key = std.SoftwareProduct != null ? `p${std.SoftwareProduct}` : `s${std.ID}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(std);
    }

    const rows: ItStandardRollupRow[] = [];
    groups.forEach((versions, key) => {
      const recent = this.getMostRecentVersion(versions);
      rows.push({
        productKey: key,
        displayName: recent.SoftwareProductName || recent.Name,
        manufacturerName: recent.ManufacturerName,
        status: recent.Status,
        deploymentType: recent.DeploymentType,
        description: recent.Description,
        approvalExpirationDate: recent.ApprovalExpirationDate,
        alsoKnownAs: recent.AlsoKnownAs,
        standardType: recent.StandardType,
        versionsCount: versions.length,
        hasMultipleVersions: versions.length > 1,
        mostRecentStandard: recent,
        versions: this.sortVersions(versions),
      });
    });

    return rows.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
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

  applyRollupFilters(): void {
    let rows = [...this.rollupRows];

    if (this.selectedTab !== 'All') {
      if (this.selectedTab === 'Other') {
        rows = rows.filter(r => !this.otherStatuses.includes(r.status));
      } else if (this.selectedTab === 'Approved') {
        rows = rows.filter(r => r.status === 'Approved' || r.status === 'Approved with conditions');
      } else {
        rows = rows.filter(r => r.status === this.selectedTab);
      }
    }

    if (this.selectedChips.length > 0) {
      rows = rows.filter(r => this.selectedChips.includes(r.deploymentType));
    }

    const term = this.searchTerm?.trim().toLowerCase();
    if (term) {
      rows = rows.filter(r =>
        this.visibleCols.some(col => {
          const val = (r as any)[col.field];
          return val != null && String(val).toLowerCase().includes(term);
        })
      );
    }

    this.rollupRowsFiltered = rows;
    this.computeRollupTotals();
  }

  private computeRollupTotals(): void {
    let base = [...this.rollupRows];
    if (this.selectedChips.length > 0) {
      base = base.filter(r => this.selectedChips.includes(r.deploymentType));
    }
    this.rollupTotals = {
      AllTotal:      base.length,
      ApprovedTotal: base.filter(r => r.status === 'Approved' || r.status === 'Approved with conditions').length,
      DeniedTotal:   base.filter(r => r.status === 'Denied').length,
      RetiredTotal:  base.filter(r => r.status === 'Retired').length,
      OtherTotal:    base.filter(r => !this.otherStatuses.includes(r.status)).length,
    };
  }

  onSelectTab(tabName: string): void {
    this.selectedTab = tabName;
    this.applyRollupFilters();
  }

  onKeyUp(e: KeyboardEvent, tabName: string): void {
    if (e.key === ' ' || e.key === 'Enter') this.onSelectTab(tabName);
  }

  onFilterChipSelect(selectedChips: string[]): void {
    this.selectedChips = selectedChips;
    this.applyRollupFilters();
  }

  isTabSelected(tabName: string): boolean {
    return this.selectedTab === tabName;
  }

  onSearchChange(): void {
    this.applyRollupFilters();
  }

  onRowClick(row: ItStandardRollupRow): void {
    this.router.navigate(['/it-standard-rollup', row.productKey], {
      queryParams: { tableSearchTerm: this.searchTerm || undefined }
    });
  }

  onVersionClick(standard: ITStandards, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/it_standards', standard.ID], {
      queryParams: { tableSearchTerm: this.searchTerm || undefined }
    });
  }

  getVersionFieldValue(version: ITStandards, field: string): any {
    switch (field) {
      case 'displayName':            return version.SoftwareReleaseName || version.Name;
      case 'versionsCount':          return 1;
      case 'manufacturerName':       return version.ManufacturerName;
      case 'description':            return version.Description;
      case 'status':                 return version.Status;
      case 'deploymentType':         return version.DeploymentType;
      case 'approvalExpirationDate': return version.ApprovalExpirationDate;
      case 'alsoKnownAs':            return version.AlsoKnownAs;
      case 'standardType':           return version.StandardType;
      default:                       return '';
    }
  }

  getStatusClass(status: string): string {
    if (status === 'Approved' || status === 'Approved with conditions') return 'status-green';
    if (status === 'Denied' || status === 'Retired' || status === 'Expired') return 'status-red';
    return 'status-yellow';
  }

  getDeploymentTypeIcon(deploymentType: string): string {
    if (deploymentType === 'Desktop') return 'fas fa-desktop';
    if (deploymentType === 'Mobile')  return 'fas fa-mobile-alt';
    if (deploymentType === 'Server')  return 'fas fa-server';
    return 'fas fa-keyboard';
  }

  onColPickerChange(event: any): void {
    const selected = new Set<string>(event.value.map((c: RollupCol) => c.field));
    this.rollupCols.forEach(col => { col.showColumn = selected.has(col.field); });
  }

  resetColumns(): void {
    const defaults = new Set(['displayName', 'versionsCount', 'manufacturerName', 'description', 'status', 'deploymentType', 'approvalExpirationDate']);
    this.rollupCols.forEach(col => { col.showColumn = defaults.has(col.field); });
    this.selectedCols = this.rollupCols.filter(c => c.showColumn);
  }

  exportData(): void {
    const headers = this.visibleCols.map(c => c.header).join(',');
    const lines = this.rollupRowsFiltered.map(row =>
      this.visibleCols.map(col => {
        let val = (row as any)[col.field];
        if (col.field === 'approvalExpirationDate' && val) {
          val = new Date(val).toLocaleDateString('en-US');
        }
        return `"${String(val ?? '').replace(/"/g, '""')}"`;
      }).join(',')
    );
    const csv = [headers, ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'it-standards.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  private applyConditionStatus(standards: ITStandards[]): ITStandards[] {
    standards.forEach(s => {
      if (s.ConditionsRestrictions && s.ConditionsRestrictions.length > 0) {
        s.Status = 'Approved with conditions';
      }
    });
    return standards;
  }

  private isInExpiringStatusScope(standard: ITStandards): boolean {
    const approvedLikeStatusIds = [11, 2, 6, 9];
    if (typeof standard.StatusId === 'number') {
      return approvedLikeStatusIds.includes(standard.StatusId);
    }
    return standard.Status === 'Approved'
      || standard.Status === 'Approved with conditions'
      || standard.Status === 'Pilot'
      || standard.Status === 'Exception'
      || standard.Status === 'Sunsetting';
  }
}
