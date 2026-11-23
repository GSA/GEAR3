import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { ApiService } from '@services/apis/api.service';
import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';

import { ITStandards } from '@api/models/it-standards.model';
import { DataDictionary } from '@api/models/data-dictionary.model';
import { Column } from '@common/table-classes';

export type ItStandardsViewMode = 'rollup' | 'flat';

export interface ItStandardRollupRow {
  productKey: string;
  displayName: string;
  manufacturerName: string;
  status: string;
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
  private readonly tabNames = ['All', 'Approved', 'Denied', 'Retired', 'Other'];

  public viewMode: ItStandardsViewMode = 'rollup';

  public rollupTableCols: Column[] = [];
  public flatTableCols: Column[] = [];

  // All standards after any dashboard deep-link date filters are applied
  private standards: ITStandards[] = [];
  private attrDefinitions: DataDictionary[] = [];

  public filterTotals: any = null;
  public selectedTab: string = 'All';
  public filterChips: string[] = ['Mobile', 'Desktop', 'Server', 'SaaS', 'PaaS', 'Other'];
  public selectedChips: string[] = [];

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

  public get isRollupView(): boolean {
    return this.viewMode === 'rollup';
  }

  public get tableCols(): Column[] {
    return this.isRollupView ? this.rollupTableCols : this.flatTableCols;
  }

  public isLoggedIn(): boolean {
    return this.sharedService.loggedIn;
  }

  public onCreateNew(): void {
    this.router.navigate(['/it_standards_manager']);
  }

  ngOnInit(): void {
    // Support deep-link filtered URLs: /it_standards/filtered/:deploymentType/:status
    // and /it_standards/status/:status
    const routeParams = this.route.snapshot.params;
    if (routeParams['deploymentType']) {
      const depType = routeParams['deploymentType'];
      const match = this.filterChips.find(c => c.toLowerCase() === depType.toLowerCase());
      if (match) {
        this.selectedChips = [match];
      }
    }
    if (routeParams['status']) {
      const status = routeParams['status'];
      this.selectedTab = status === 'ApprovedDenied'
        ? 'ApprovedDenied'
        : status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    }

    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        this.selectedTab = params['tab'];
      }
      if (params['deploymentTypes']) {
        const types: string[] = params['deploymentTypes'].split(',');
        this.selectedChips = types
          .filter(t => this.filterChips.some(c => c.toLowerCase() === t.toLowerCase()))
          .map(t => this.filterChips.find(c => c.toLowerCase() === t.toLowerCase())!);
      }
      if (params['status']) {
        this.selectedTab = params['status'].charAt(0).toUpperCase() + params['status'].slice(1).toLowerCase();
      }
      if (params['expiringWithinDays']) {
        this.daysExpiring = +params['expiringWithinDays'];
      }
      if (params['includePastDue']) {
        this.includePastDueExpirations = params['includePastDue'] === 'true';
      }
      if (params['pastDueOnly']) {
        this.pastDueOnly = params['pastDueOnly'] === 'true';
      }
      if (params['retiredWithinDays']) {
        this.daysRetired = +params['retiredWithinDays'];
      }
    });

    this.sharedService.setJWTonLogIn();

    forkJoin({
      defs: this.apiService.getDataDictionaryByReportName('IT Standards List'),
      standards: this.apiService.getITStandards(),
    }).subscribe(({ defs, standards }) => {
      this.attrDefinitions = defs;
      this.rollupTableCols = this.buildRollupTableCols();
      this.flatTableCols = this.buildFlatTableCols();

      this.applyConditionStatus(standards);
      this.standards = this.applyDateFilters(standards);
      this.refreshTable();
    });
  }

  // ── View toggle ──────────────────────────────────────────────────────────

  public onToggleView(): void {
    this.viewMode = this.isRollupView ? 'flat' : 'rollup';
    this.refreshTable();
  }

  // ── Table data ───────────────────────────────────────────────────────────

  private refreshTable(): void {
    const filtered = this.getFilteredStandards(this.selectedTab);
    const data = this.isRollupView ? this.buildRollupRows(filtered) : filtered;
    this.tableService.updateReportTableData(data);
    this.tableService.updateReportTableDataReadyStatus(true);
    this.computeFilterTotals();
  }

  private getFilteredStandards(tab: string): ITStandards[] {
    return this.standards.filter(s =>
      this.matchesTab(s.Status, tab) &&
      (!this.hasSelectedChips() || this.selectedChips.includes(s.DeploymentType))
    );
  }

  private matchesTab(status: string, tab: string): boolean {
    switch (tab) {
      case 'All':            return true;
      case 'Approved':       return status === 'Approved' || status === 'Approved with conditions';
      case 'ApprovedDenied': return status === 'Approved' || status === 'Approved with conditions' || status === 'Denied';
      case 'Other':          return !this.otherStatuses.includes(status);
      default:               return status === tab;
    }
  }

  // Tab counts reflect the number of rows each tab would show in the current view
  private computeFilterTotals(): void {
    const count = (tab: string): number => {
      const matches = this.getFilteredStandards(tab);
      return this.isRollupView
        ? new Set(matches.map(s => this.getProductKey(s))).size
        : matches.length;
    };

    const totals: any = {};
    this.tabNames.forEach(tab => totals[`${tab}Total`] = count(tab));
    this.filterTotals = totals;
  }

  private getProductKey(std: ITStandards): string {
    return std.SoftwareProduct != null ? `p${std.SoftwareProduct}` : `s${std.ID}`;
  }

  private buildRollupRows(standards: ITStandards[]): ItStandardRollupRow[] {
    const groups = new Map<string, ITStandards[]>();

    for (const std of standards) {
      const key = this.getProductKey(std);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(std);
    }

    const rows: ItStandardRollupRow[] = [];
    groups.forEach((versions, key) => {
      const recent = this.getMostRecentVersion(versions);
      rows.push({
        productKey:             key,
        displayName:            this.getRollupDisplayName(recent),
        manufacturerName:       recent.ManufacturerName,
        status:                 recent.Status,
        description:            recent.Description,
        approvalExpirationDate: recent.ApprovalExpirationDate,
        alsoKnownAs:            recent.AlsoKnownAs,
        standardType:           recent.StandardType,
        versionsCount:          versions.length,
        hasMultipleVersions:    versions.length > 1,
        mostRecentStandard:     recent,
        versions:               this.sortVersions(versions),
      });
    });

    return rows.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
  }

  // "<Manufacturer> <Software Product>", without repeating the manufacturer when the
  // product name already starts with it (e.g. "Microsoft" + "Microsoft Teams").
  private getRollupDisplayName(std: ITStandards): string {
    const manufacturer = (std.ManufacturerName || '').trim();
    const product = (std.SoftwareProductName || '').trim();

    if (!product) return std.Name;
    if (!manufacturer || product.toLowerCase().startsWith(manufacturer.toLowerCase())) return product;
    return `${manufacturer} ${product}`;
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

  // ── Tabs / chips ─────────────────────────────────────────────────────────

  public onSelectTab(tabName: string): void {
    this.selectedTab = tabName;
    this.syncUrlToFilters();
    this.refreshTable();
  }

  public onKeyUp(e: KeyboardEvent, tabName: string): void {
    if (e.key === ' ' || e.key === 'Enter') this.onSelectTab(tabName);
  }

  public onFilterChipSelect(selectedChips: string[]): void {
    this.selectedChips = selectedChips;
    this.syncUrlToFilters();
    this.refreshTable();
  }

  public isTabSelected(tabName: string): boolean {
    return this.selectedTab === tabName;
  }

  private hasSelectedChips(): boolean {
    return this.selectedChips && this.selectedChips.length > 0;
  }

  private syncUrlToFilters(): void {
    const chips = this.selectedChips;
    const tab = this.selectedTab;
    const hasChips = chips.length > 0;
    const hasTab = tab && tab !== 'All';

    if (hasChips && hasTab) {
      if (chips.length === 1) {
        this.router.navigate(['/it_standards/filtered', chips[0], tab], { replaceUrl: true });
      } else {
        this.router.navigate(['/it_standards'], {
          replaceUrl: true,
          queryParams: { deploymentTypes: chips.join(','), status: tab }
        });
      }
    } else if (hasChips) {
      if (chips.length === 1) {
        this.router.navigate(['/it_standards/filtered', chips[0]], { replaceUrl: true });
      } else {
        this.router.navigate(['/it_standards'], {
          replaceUrl: true,
          queryParams: { deploymentTypes: chips.join(',') }
        });
      }
    } else if (hasTab) {
      if (tab === 'ApprovedDenied') {
        this.router.navigate(['/it_standards'], { replaceUrl: true, queryParams: { tab: 'ApprovedDenied' } });
      } else {
        this.router.navigate(['/it_standards/status', tab], { replaceUrl: true });
      }
    } else {
      this.router.navigate(['/it_standards'], { replaceUrl: true });
    }
  }

  // ── Navigation ───────────────────────────────────────────────────────────

  // Rollup rows with multiple versions are expanded by the table on click and never reach
  // here; single-version rollup rows and flat rows go straight to the details page.
  public onRowClick(e: any): void {
    const standard: ITStandards | undefined = this.isRollupView ? e.versions?.[0] : e;
    if (!standard || (this.isRollupView && e.hasMultipleVersions)) return;
    this.navigateToDetails(standard, e.tableSearchString);
  }

  public onVersionClick(standard: ITStandards, event: Event): void {
    event.stopPropagation();
    this.navigateToDetails(standard);
  }

  private navigateToDetails(standard: ITStandards, searchTerm?: string): void {
    this.router.navigate(['/it_standards', standard.ID], {
      queryParams: { tableSearchTerm: searchTerm || undefined }
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private applyConditionStatus(standards: ITStandards[]): void {
    standards.forEach(s => {
      if (s.ConditionsRestrictions && s.ConditionsRestrictions.length > 0) {
        s.Status = 'Approved with conditions';
      }
    });
  }

  // Keep dashboard deep-link filters consistent with backend totals query scope.
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

  private YesNo(value: any): string {
    return value === 'T' ? 'Yes' : 'No';
  }

  private tooltip(name: string): string {
    return this.sharedService.getTooltip(this.attrDefinitions, name);
  }

  // ── Column definitions ───────────────────────────────────────────────────

  private buildRollupTableCols(): Column[] {
    return [
      { field: 'displayName',            header: 'IT Standard Name', isSortable: true, showColumn: true,  titleTooltip: this.tooltip('IT Standard Name') },
      { field: 'versionsCount',          header: '# of Versions',    isSortable: true, showColumn: true },
      { field: 'manufacturerName',       header: 'Manufacturer',     isSortable: true, showColumn: true,  titleTooltip: this.tooltip('Manufacturer Name') },
      { field: 'description',            header: 'Description',      isSortable: true, showColumn: true,  formatter: this.sharedService.formatDescriptionLite, titleTooltip: this.tooltip('Description') },
      { field: 'status',                 header: 'Status',           isSortable: true, showColumn: true,  formatter: this.sharedService.formatStatus, titleTooltip: this.tooltip('Status') },
      { field: 'approvalExpirationDate', header: 'Approval Expires', isSortable: true, showColumn: true,  formatter: this.sharedService.dateFormatter, titleTooltip: this.tooltip('Approval Expiration Date') },
      { field: 'alsoKnownAs',            header: 'Also Known As',    isSortable: true, showColumn: false, titleTooltip: this.tooltip('Previously Known As') },
      { field: 'standardType',           header: 'Standard Type',    isSortable: true, showColumn: false, titleTooltip: this.tooltip('Standard Type') },
    ];
  }

  private buildFlatTableCols(): Column[] {
    return [
      { field: 'ID',                     header: 'ID',                               isSortable: true,  showColumn: false, titleTooltip: this.tooltip('ID') },
      { field: 'Name',                   header: 'IT Standard Name',                 isSortable: true,  showColumn: true,  titleTooltip: this.tooltip('IT Standard Name') },
      { field: 'ApprovedVersions',       header: 'Approved Versions',                isSortable: false, showColumn: true,  titleTooltip: this.tooltip('Approved Versions') },
      { field: 'ManufacturerName',       header: 'Manufacturer',                     isSortable: true,                     titleTooltip: this.tooltip('Manufacturer Name') },
      { field: 'Description',            header: 'Description',                      isSortable: true,  showColumn: true,  formatter: this.sharedService.formatDescriptionLite, titleTooltip: this.tooltip('Description') },
      { field: 'Status',                 header: 'Status',                           isSortable: true,                     formatter: this.sharedService.formatStatus, titleTooltip: this.tooltip('Status') },
      { field: 'DeploymentType',         header: 'Deployment Type',                  isSortable: true,                     formatter: this.sharedService.formatDeploymentType, titleTooltip: this.tooltip('Deployment Type') },
      { field: 'ApprovalExpirationDate', header: 'Approval Expires',                 isSortable: true,  showColumn: true,  formatter: this.sharedService.dateFormatter, titleTooltip: this.tooltip('Approval Expiration Date') },
      { field: 'Manufacturer',           header: 'Manufacturer ID',                  isSortable: true,  showColumn: false, titleTooltip: this.tooltip('Manufacturer ID') },
      { field: 'SoftwareProduct',        header: 'Product ID',                       isSortable: true,  showColumn: false, titleTooltip: this.tooltip('Software Product ID') },
      { field: 'SoftwareProductName',    header: 'Product',                          isSortable: true,  showColumn: false, titleTooltip: this.tooltip('Software Product Name') },
      { field: 'SoftwareVersion',        header: 'Version ID',                       isSortable: true,  showColumn: false, titleTooltip: this.tooltip('Software Version ID') },
      { field: 'SoftwareVersionName',    header: 'Version',                          isSortable: true,  showColumn: false, titleTooltip: this.tooltip('Software Version Name') },
      { field: 'SoftwareRelease',        header: 'Release ID',                       isSortable: true,  showColumn: false, titleTooltip: this.tooltip('Software Release ID') },
      { field: 'SoftwareReleaseName',    header: 'Release',                          isSortable: true,  showColumn: false, titleTooltip: this.tooltip('Software Release Name') },
      { field: 'AlsoKnownAs',            header: 'Also Known As',                    isSortable: true,  showColumn: false, titleTooltip: this.tooltip('Previously Known As') },
      { field: 'StandardType',           header: 'Standard Type',                    isSortable: true,  showColumn: false, titleTooltip: this.tooltip('Standard Type') },
      { field: 'ComplianceStatus',       header: '508 Compliance',                   isSortable: true,  showColumn: false, titleTooltip: this.tooltip('508 Compliance') },
      { field: 'ExceptionLink',          header: '508 Exception Link',               isSortable: true,  showColumn: false, titleTooltip: this.tooltip('508 Exception Link') },
      { field: 'POC',                    header: 'POC',                              isSortable: true,  showColumn: false, titleTooltip: this.tooltip('POC') },
      { field: 'POCorg',                 header: 'POC Org',                          isSortable: true,  showColumn: false, titleTooltip: this.tooltip('POC Org') },
      { field: 'Comments',               header: 'Comments',                         isSortable: true,  showColumn: false, formatter: this.sharedService.formatDescription, titleTooltip: this.tooltip('Comments') },
      { field: 'fedramp',                header: 'FedRAMP',                          isSortable: true,  showColumn: false, formatter: this.YesNo, titleTooltip: this.tooltip('FedRAMP') },
      { field: 'open_source',            header: 'Open Source',                      isSortable: true,  showColumn: false, formatter: this.YesNo, titleTooltip: this.tooltip('Open Source') },
      { field: 'RITM',                   header: 'Requested Item (RITM)',            isSortable: true,  showColumn: false, titleTooltip: this.tooltip('Requested Item (RITM)') },
      { field: 'OperatingSystems',       header: 'Operating Systems',                isSortable: false, showColumn: false, formatter: this.sharedService.csvFormatter, titleTooltip: this.tooltip('Operating Systems') },
      { field: 'AppBundleIds',           header: 'App Bundle Ids',                   isSortable: false, showColumn: false, formatter: this.sharedService.csvFormatter, titleTooltip: this.tooltip('App Bundle Ids') },
      { field: 'ConditionsRestrictions', header: 'Conditions/Restrictions',          isSortable: false, showColumn: false, titleTooltip: this.tooltip('ConditionsRestrictions') },
      { field: 'CriticalReview',         header: 'Critical Software Review Results', isSortable: true,  showColumn: false, titleTooltip: this.tooltip('Critical Software Review Results') },
      { field: 'CSCRMReview',            header: 'C-SCRM Review Results',            isSortable: true,  showColumn: false, hideFromPicker: true, titleTooltip: this.tooltip('C-SCRM Review Results') },
    ];
  }
}
