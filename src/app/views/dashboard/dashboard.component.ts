import { Component, OnInit, HostListener, AfterViewInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Column } from '@common/table-classes';
import { ApiService } from '@services/apis/api.service';
import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';
import { forkJoin } from 'rxjs';
import { AnalyticsService } from '@services/analytics/analytics.service';
import { DataDictionary } from '@api/models/data-dictionary.model';

@Component({
    selector: 'dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
    standalone: false
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {

  public isDataReady: boolean = false;

  private resizeObserver: any = null;

  public readonly recentITStandardAmount: number = 10;

  public attrDefinitions: DataDictionary[] = [];

  public chartView: [number, number] = [0, 400];
  public barChartView: [number, number] = [0, 350];
  public pieChartView: [number, number] = [0, 280];
  public shouldRotateLabels: boolean = false;
  
  public colorScheme = {
    domain: ['#1f77b4', '#17becf', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b']
  };
  public pieColorScheme = {
    domain: ['#1F77B4', '#B07D12']
  };

  public hostingPlatformsData: any[] = [];

  public cloudBusinessSystemsData = [
    { name: 'Cloud Based', value: 0 },
    { name: 'Not Cloud Based', value: 0 }
  ];

  public totalBusinessSystems: number = 0;

  public labelFormatting = (value: any): string => {
    return value;
  };

  public xAxisTickFormatting = (value: string): string => {
    const screenWidth = window.innerWidth;
    const maxLength = screenWidth <= 576 ? 8 : screenWidth <= 992 ? 10 : 12;
    return value.length > maxLength ? value.substring(0, maxLength) + '...' : value;
  };

  private checkIfLabelsShouldRotate(): void {
    if (!this.hostingPlatformsData?.length) {
      this.shouldRotateLabels = false;
      return;
    }

    const container = document.querySelector('.bar-chart-content');
    if (!container) {
      this.shouldRotateLabels = false;
      return;
    }

    const screenWidth = window.innerWidth;
    if (screenWidth >= 1200) {
      this.shouldRotateLabels = false;
      return;
    }
    
    const containerWidth = container.clientWidth;
    const dataCount = this.hostingPlatformsData.length;
    const availableSpacePerLabel = containerWidth / dataCount;
    const longestLabel = Math.max(...this.hostingPlatformsData.map(item => item.name.length));
    const charWidth = screenWidth <= 576 ? 8 : screenWidth <= 992 ? 9 : 10;
    const estimatedLabelWidth = longestLabel * charWidth;
    
    this.shouldRotateLabels = estimatedLabelWidth > (availableSpacePerLabel - 20) || 
                              (dataCount > 6 && screenWidth <= 992);
  }

  public tableCols: Column[] = [
    {
      field: 'Name',
      header: 'IT Standard Name',
      isSortable: false,
      showColumn: true,
    },{
      field: 'Description',
      header: 'Description',
      isSortable: false,
      showColumn: true,
      formatter: this.sharedService.formatDescriptionLite
    },{
      field: 'Category',
      header: 'Category',
      isSortable: false,
      showColumn: true,
    },{
      field: 'Status',
      header: 'Status',
      isSortable: false,
      showColumn: true,
      formatter: this.sharedService.formatStatus
    },{
      field: 'DeploymentType',
      header: 'Deployment Type',
      isSortable: false,
      showColumn: true,
      formatter: this.sharedService.formatDeploymentType
    },{
      field: 'ApprovalExpirationDate',
      header: 'Approval Expires',
      isSortable: false,
      showColumn: true,
      formatter: this.sharedService.dateFormatter
    },{
      field: 'ApprovedVersions',
      header: 'Approved Versions',
      isSortable: false,
      showColumn: true,
      formatter: this.sharedService.formatApprovedVersions
    },
    {
      field: 'DateCreated',
      header: 'Date Created',
      isSortable: false,
      showColumn: true,
      formatter: this.sharedService.dateFormatter
    }
  ];

  public fismaExpiringThisQuarter: number = 0;
  public fismaExpiringThisWeek: number = 0;
  public fismaPastDue: number = 0;

  public decommissionedSystemsLast6Months: number = 0;
  public decommissionedSystemsLastMonth: number = 0;

  public standardsExpiringThisQuarter: number = 0;
  public standardsExpiringThisWeek: number = 0;
  public standardsPastDue: number = 0;

  public retiredITStandardsLast6Months: number = 0;
  public retiredITStandardsLast7Days: number = 0;
  
 constructor(
    private apiService: ApiService,
    private tableService: TableService,
    private sharedService: SharedService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private analyticsService: AnalyticsService
  ) { }

  public ngOnInit(): void {
    // Single aggregated call replaces 9 separate dashboard metric requests
    forkJoin([
      this.apiService.getDashboardSummary(),
      this.apiService.getDataDictionaryByReportName('IT Standards List')
    ]).subscribe(([summary, definitions]) => {
      this.standardsExpiringThisQuarter = summary.standardsExpiringThisQuarter ?? 0;
      this.standardsExpiringThisWeek    = summary.standardsExpiringThisWeek ?? 0;
      this.standardsPastDue             = summary.standardsPastDue ?? 0;
      this.fismaExpiringThisQuarter     = summary.fismaExpiringThisQuarter ?? 0;
      this.fismaExpiringThisWeek        = summary.fismaExpiringThisWeek ?? 0;
      this.fismaPastDue                 = summary.fismaPastDue ?? 0;

      this.decommissionedSystemsLast6Months = summary.decommissionedSystemsLast6Months ?? 0;
      this.decommissionedSystemsLastMonth   = summary.decommissionedSystemsLastMonth ?? 0;
      this.retiredITStandardsLast6Months    = summary.retiredStandardsLast6Months ?? 0;
      this.retiredITStandardsLast7Days      = summary.retiredStandardsLastWeek ?? 0;

      const cloudData = summary.cloudAdoptionRate;
      if (cloudData) {
        this.cloudBusinessSystemsData = [
          { name: 'Cloud Based', value: cloudData.CloudBusSystemsCount },
          { name: 'Not Cloud Based', value: cloudData.BusSystemsCount - cloudData.CloudBusSystemsCount }
        ];
        this.totalBusinessSystems = cloudData.BusSystemsCount || 0;
      }

      this.attrDefinitions = definitions;
      this.isDataReady = true;
    });

    this.apiService.getRecentITStandards(this.recentITStandardAmount).subscribe(standards => {
      this.tableService.updateReportTableData(standards);
      this.tableService.updateReportTableDataReadyStatus(true);
    });

    this.loadHostingPlatformsData();
  }

  public ngAfterViewInit(): void {
    this.updateChartViews();
    this.setupResizeObserver();
    this.cdr.detectChanges();
  }

  public ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  @HostListener('window:resize')
  onResize() {
    this.updateChartViews();
    this.updateResponsiveChartHeights();
  }

  private loadHostingPlatformsData(): void {
    // Replaces full GET /api/systems (1.98MB) with a lightweight aggregation endpoint
    this.apiService.getHostingPlatforms().subscribe(rows => {
      // Normalize names first, then merge duplicate names so ngx-charts
      // does not silently overwrite bars that share the same key.
      const mergedMap = new Map<string, number>();
      for (const row of rows) {
        const name = this.normalizePlatformName(row.CSP);
        mergedMap.set(name, (mergedMap.get(name) ?? 0) + row.count);
      }

      const { individualPlatforms, othersCount } = Array.from(mergedMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .reduce((acc, platform) => {
          if (platform.value >= 3) {
            acc.individualPlatforms.push(platform);
          } else {
            acc.othersCount += platform.value;
          }
          return acc;
        }, { individualPlatforms: [] as any[], othersCount: 0 });

      const finalData = [...individualPlatforms];
      if (othersCount > 0) {
        finalData.push({ name: 'Others', value: othersCount });
      }

      this.hostingPlatformsData = finalData;
      this.updateChartViews();
      this.cdr.detectChanges();
    });
  }

  private normalizePlatformName(platform: string): string {
    switch (platform) {
      case 'AWS (GovCloud)':
      case 'AWS':
      case 'FedRAMP AWS East/West':
        return 'AWS';
      case 'cloud.gov':
        return 'Cloud.gov';
      default:
        return platform;
    }
  }

  private setupResizeObserver(): void {
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.updateChartViews();
      });

      const barContainer = document.querySelector('.bar-chart-content');
      const pieContainer = document.querySelector('.pie-chart-content');
      
      if (barContainer) {
        this.resizeObserver.observe(barContainer);
      }
      if (pieContainer) {
        this.resizeObserver.observe(pieContainer);
      }
    }
  }

  private updateResponsiveChartHeights(): void {
    const screenWidth = window.innerWidth;
    
    if (screenWidth <= 1366 && screenWidth >= 992) {
      this.pieChartView = [this.pieChartView[0], 220];
      this.barChartView = [this.barChartView[0], 300];
    } else {
      this.pieChartView = [this.pieChartView[0], 280];
      this.barChartView = [this.barChartView[0], 350];
    }
    
    this.cdr.detectChanges();
  }

  private updateChartViews() {
    this.checkIfLabelsShouldRotate();
    
    const barContainer: any = document.getElementsByClassName('bar-chart-content')[0];
    if (barContainer) {
      const barWidth = barContainer.offsetWidth;
      const screenWidth = window.innerWidth;
      
      const heights = this.shouldRotateLabels 
        ? { 576: 240, 992: 260, 1400: 280, default: 320 }
        : { 576: 240, 992: 260, 1400: 280, default: 320 };
      
      const barHeight = screenWidth <= 576 ? heights[576] :
                        screenWidth <= 992 ? heights[992] :
                        screenWidth <= 1400 ? heights[1400] : heights.default;
      
      this.barChartView = [barWidth, barHeight];
    } else {
      this.barChartView = [600, 350];
    }

    const pieContainer: any = document.getElementsByClassName('pie-chart-content')[0];
    if (pieContainer) {
      const pieWidth = pieContainer.offsetWidth;
      const screenWidth = window.innerWidth;
      const pieHeight = screenWidth <= 576 ? 180 :
                        screenWidth <= 992 ? 200 :
                        screenWidth <= 1400 ? 220 : 240;
      this.pieChartView = [pieWidth, pieHeight];
    } else {
      this.pieChartView = [400, 280];
    }

    this.cdr.detectChanges();
  }

  public getExpiringDate(): string {
    const today = new Date();
    const threeMonthsFromNow = new Date(today.setMonth(today.getMonth() + 3));

    const day = threeMonthsFromNow.getDate();
    const month = threeMonthsFromNow.toLocaleString('default', { month: 'long' });

    return `${month} ${day}`;
  }

  public navigateToHostingPlatforms(): void {
    this.router.navigate(['/systems']);
  }

  public navigateToCloudSystems(): void {
    this.router.navigate(['/systems']);
  }

  public navigateToCloudBasedSystems(): void {
    this.analyticsService.logClickEvent('/systems?tab=CloudEnabled', 'Dashboard business systems graph');
    this.router.navigate(['/systems'], { queryParams: { tab: 'Cloud Enabled' } });
  }

  public navigateToNonCloudBasedSystems(): void {
    this.analyticsService.logClickEvent('/systems?tab=Inactive', 'Dashboard business systems graph');
    this.router.navigate(['/systems'], { queryParams: { cloudBased: 'no' } });
  }

  public onPieChartSelect(event: any): void {
    if (event && event.name) {
      if (event.name === 'Cloud Based') {
        this.navigateToCloudBasedSystems();
      } else if (event.name === 'Not Cloud Based') {
        this.navigateToNonCloudBasedSystems();
      }
    }
  }

  public viewAllFisma(): void {
    this.analyticsService.logClickEvent('/FISMA', 'Dashboard view all FISMA');
    this.router.navigate(['/FISMA']);
  }
  public viewAllSystems(): void {
    this.analyticsService.logClickEvent('/systems', 'Dashboard view all systems');
    this.router.navigate(['/systems']);
  }
  public viewAllITStandards(): void {
    this.analyticsService.logClickEvent('/it_standards', 'Dashboard view all IT standards');
    this.router.navigate(['/it_standards']);
  }

  public viewExpiringFisma():void {
    this.analyticsService.logClickEvent('/FISMA', 'Dashboard FISMA expiring this week');
    this.router.navigate(['/FISMA'], { queryParams: { expiringWithinDays: '7' } });
  }
  public viewPastDueFisma(): void {
    this.analyticsService.logClickEvent('/FISMA', 'Dashboard FISMA past due');
    this.router.navigate(['/FISMA'], { queryParams: { pastDueOnly: 'true' } });
  }
  public viewDecommissionedSystems(): void {
    this.analyticsService.logClickEvent('/systems', 'Dashboard decommissioned systems this week');
    this.router.navigate(['/systems'], { queryParams: { decommissionedWithinMonths: '1' } });
  }
  public viewExpiringITStandards(): void {
    this.analyticsService.logClickEvent('/it_standards', 'Dashboard IT standards expiring this week');
    this.router.navigate(['/it_standards'], { queryParams: { expiringWithinDays: '7' } });
  }
  public viewPastDueITStandards(): void {
    this.analyticsService.logClickEvent('/it_standards', 'Dashboard IT standards past due');
    this.router.navigate(['/it_standards'], { queryParams: { pastDueOnly: 'true' } });
  }
  public viewRecentRetiredITStandards(): void {
    this.analyticsService.logClickEvent('/it_standards', 'Dashboard IT standards retired in past week');
    this.router.navigate(['/it_standards'], { queryParams: { retiredWithinDays: '7' } });
  }

  public onTableRowClick(rowData: any): void {
    this.router.navigate(['/it_standards', rowData.ID], {
      queryParams: { fromPrevious: rowData.Name }
    });
  }

  public onBarChartClick(barName: string): void {
    if(barName !== 'Others'){
      this.router.navigate(['/systems'], {queryParams: { systemCSP: barName } });
    } 

  }

  public getFismaExpiryAlertCount(): number {
    return (this.fismaExpiringThisWeek || 0) + (this.fismaPastDue || 0);
  }

  public getStandardsExpiryAlertCount(): number {
    return (this.standardsExpiringThisWeek || 0) + (this.standardsPastDue || 0);
  }

  private itemLabel(count: number): string {
    return `${count} item${count === 1 ? '' : 's'}`;
  }

  public getFismaPastDueLabel(): string {
    return `${this.itemLabel(this.fismaPastDue || 0)} past due`;
  }

  public getFismaExpiringSoonLabel(): string {
    return `${this.itemLabel(this.fismaExpiringThisWeek || 0)} expiring within 7 days`;
  }

  public getStandardsPastDueLabel(): string {
    return `${this.itemLabel(this.standardsPastDue || 0)} past due`;
  }

  public getStandardsExpiringSoonLabel(): string {
    return `${this.itemLabel(this.standardsExpiringThisWeek || 0)} expiring within 7 days`;
  }
}