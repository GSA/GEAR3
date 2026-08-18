import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ApiService } from '@services/apis/api.service';
import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';

import { ITStandards } from '@api/models/it-standards.model';
import { Column } from '@common/table-classes';

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

  public rollupTableCols: Column[] = [
    { field: 'displayName',            header: 'IT Standard Name',  isSortable: true,  showColumn: true  },
    { field: 'versionsCount',          header: 'Versions',          isSortable: true,  showColumn: true  },
    { field: 'manufacturerName',       header: 'Manufacturer',      isSortable: true,  showColumn: true  },
    { field: 'description',            header: 'Description',       isSortable: true,  showColumn: true,  formatter: this.sharedService.formatDescriptionLite },
    { field: 'status',                 header: 'Status',            isSortable: true,  showColumn: true,  formatter: this.sharedService.formatStatus },
    { field: 'deploymentType',         header: 'Deployment Type',   isSortable: true,  showColumn: true,  formatter: this.sharedService.formatDeploymentType },
    { field: 'approvalExpirationDate', header: 'Approval Expires',  isSortable: true,  showColumn: true,  formatter: this.sharedService.dateFormatter },
    { field: 'alsoKnownAs',            header: 'Also Known As',     isSortable: true,  showColumn: false },
    { field: 'standardType',           header: 'Standard Type',     isSortable: true,  showColumn: false },
  ];

  public rollupRows: ItStandardRollupRow[] = [];
  public filterTotals: any = null;
  public selectedTab: string = 'All';
  public filterChips: string[] = ['Mobile', 'Desktop', 'Server', 'SaaS', 'PaaS', 'Other'];
  private selectedChips: string[] = [];

  public daysExpiring: number = 0;
  public daysRetired: number = 0;
  public includePastDueExpirations: boolean = false;
  public pastDueOnly: boolean = false;

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    public sharedService: SharedService,
    private tableService: TableService,
    private router: Router
  ) {}

  public isLoggedIn(): boolean {
    return this.sharedService.loggedIn;
  }

  public onCreateNew(): void {
    this.router.navigate(['/it_standards_manager']);
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['tab'])               this.selectedTab = params['tab'];
      if (params['expiringWithinDays']) this.daysExpiring = +params['expiringWithinDays'];
      if (params['includePastDue'])    this.includePastDueExpirations = params['includePastDue'] === 'true';
      if (params['pastDueOnly'])       this.pastDueOnly = params['pastDueOnly'] === 'true';
      if (params['retiredWithinDays']) this.daysRetired = +params['retiredWithinDays'];
    });

    this.sharedService.setJWTonLogIn();

    this.apiService.getITStandards().subscribe(standards => {
      this.applyConditionStatus(standards);
      const dateFiltered = this.applyDateFilters(standards);
      this.rollupRows = this.buildRollupRows(dateFiltered);
      this.computeFilterTotals();

      if (this.selectedTab !== 'All') {
        this.onSelectTab(this.selectedTab);
      } else {
        this.tableService.updateReportTableData(this.rollupRows);
        this.tableService.updateReportTableDataReadyStatus(true);
      }
    });
  }

  private applyDateFilters(standards: ITStandards[]): ITStandards[] {
    const p = this.route.snapshot.queryParams;
    const daysExpiring = Number(p['expiringWithinDays'] || this.daysExpiring || 0);
    const daysRetired  = Number(p['retiredWithinDays']  || this.daysRetired  || 0);
    const includePastDue = p['includePastDue'] === 'true' || this.includePastDueExpirations;
    const pastDueOnly    = p['pastDueOnly']    === 'true' || this.pastDueOnly;

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
        productKey:           key,
        displayName:          recent.SoftwareProductName || recent.Name,
        manufacturerName:     recent.ManufacturerName,
        status:               recent.Status,
        deploymentType:       recent.DeploymentType,
        description:          recent.Description,
        approvalExpirationDate: recent.ApprovalExpirationDate,
        alsoKnownAs:          recent.AlsoKnownAs,
        standardType:         recent.StandardType,
        versionsCount:        versions.length,
        hasMultipleVersions:  versions.length > 1,
        mostRecentStandard:   recent,
        versions:             this.sortVersions(versions),
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
      if (s === 'Denied')  return 1;
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

  private computeFilterTotals(): void {
    const base = this.hasSelectedChips()
      ? this.rollupRows.filter(r => this.selectedChips.includes(r.deploymentType))
      : this.rollupRows;

    this.filterTotals = {
      AllTotal:      base.length,
      ApprovedTotal: base.filter(r => r.status === 'Approved' || r.status === 'Approved with conditions').length,
      DeniedTotal:   base.filter(r => r.status === 'Denied').length,
      RetiredTotal:  base.filter(r => r.status === 'Retired').length,
      OtherTotal:    base.filter(r => !this.otherStatuses.includes(r.status)).length,
    };
  }

  private getTabFilteredRows(): ItStandardRollupRow[] {
    let rows = [...this.rollupRows];

    if (this.selectedTab === 'Other') {
      rows = rows.filter(r => !this.otherStatuses.includes(r.status));
    } else if (this.selectedTab === 'Approved') {
      rows = rows.filter(r => r.status === 'Approved' || r.status === 'Approved with conditions');
    } else if (this.selectedTab !== 'All') {
      rows = rows.filter(r => r.status === this.selectedTab);
    }

    if (this.hasSelectedChips()) {
      rows = rows.filter(r => this.selectedChips.includes(r.deploymentType));
    }

    return rows;
  }

  public onSelectTab(tabName: string): void {
    this.selectedTab = tabName;
    this.tableService.updateReportTableData(this.getTabFilteredRows());
    this.tableService.updateReportTableDataReadyStatus(true);
  }

  public onKeyUp(e: KeyboardEvent, tabName: string): void {
    if (e.key === ' ' || e.key === 'Enter') this.onSelectTab(tabName);
  }

  public onFilterChipSelect(selectedChips: string[]): void {
    this.selectedChips = selectedChips;
    this.tableService.updateReportTableData(this.getTabFilteredRows());
    this.tableService.updateReportTableDataReadyStatus(true);
    this.computeFilterTotals();
  }

  public isTabSelected(tabName: string): boolean {
    return this.selectedTab === tabName;
  }

  private hasSelectedChips(): boolean {
    return this.selectedChips && this.selectedChips.length > 0;
  }

  public onRowClick(e: any): void {
    const searchTerm: string = e.tableSearchString || '';
    this.router.navigate(['/it-standard-rollup', e.productKey], {
      queryParams: { tableSearchTerm: searchTerm || undefined }
    });
  }

  public onVersionClick(standard: ITStandards, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/it_standards', standard.ID]);
  }

  private applyConditionStatus(standards: ITStandards[]): void {
    standards.forEach(s => {
      if (s.ConditionsRestrictions && s.ConditionsRestrictions.length > 0) {
        s.Status = 'Approved with conditions';
      }
    });
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
