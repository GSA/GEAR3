import { Component, OnInit, HostListener, AfterViewInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Column } from '@common/table-classes';
import { ApiService } from '@services/apis/api.service';
import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';
import { Website } from '@api/models/websites.model';
import { Subscription } from 'rxjs';
import { AnalyticsService } from '@services/analytics/analytics.service';

@Component({
    selector: 'dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
    standalone: false
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {

  public showTable = false;
  private sidebarSubscription: Subscription;
  private resizeObserver: ResizeObserver;

  public chartView: [number, number] = [0, 400];
  public barChartView: [number, number] = [0, 350];
  public pieChartView: [number, number] = [0, 280];
  
  public colorScheme = {
    domain: ['#1f77b4', '#17becf', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b']
  };
  public pieColorScheme = {
    domain: ['#4CAF50', '#FF6B35']
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
    if (value.length > 12) {
      return value.substring(0, 12) + '...';
    }
    return value;
  };

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

  public decommissionedSystemsLast6Months: number = 0;
  public decommissionedSystemsLast7Days: number = 0;

  public standardsExpiringThisQuarter: number = 0;
  public standardsExpiringThisWeek: number = 0;

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
    this.sidebarSubscription = this.sharedService.sidebarVisible.subscribe((isVisible: boolean) => {
      setTimeout(() => {
        this.updateChartViews();
        this.updateResponsiveChartHeights();
        this.cdr.detectChanges();
      }, 200);
    });

    this.apiService.getRecentITStandards(10).subscribe(standards => {
      this.tableService.updateReportTableData(standards);
      setTimeout(() => {
        this.showTable = true;
      }, 0);
    });

    this.apiService.getITStandardsExpiringThisQuarter().subscribe(q => this.standardsExpiringThisQuarter = q);
    this.apiService.getITStandardsExpiringThisWeek().subscribe(w => this.standardsExpiringThisWeek = w);

    this.apiService.getFismaExpiringThisQuarter().subscribe(q => this.fismaExpiringThisQuarter = q);
    this.apiService.getFismaExpiringThisWeek().subscribe(w => this.fismaExpiringThisWeek = w);

    this.apiService.getCloudAdoptionRate().subscribe(cloudData => {
      if (cloudData && cloudData.length > 0) {
        const latestData = cloudData[0];
        this.cloudBusinessSystemsData = [
          { name: 'Cloud Based', value: latestData.CloudBusSystemsCount },
          { name: 'Not Cloud Based', value: latestData.BusSystemsCount - latestData.CloudBusSystemsCount }
        ];
        this.totalBusinessSystems = latestData.BusSystemsCount;
      }
    });

    this.apiService.getDecommissionedSystemTotals().subscribe(totals => {
      this.decommissionedSystemsLast6Months = totals.DecommissionedSystemsLastSixMonths;
      this.decommissionedSystemsLast7Days = totals.DecommissionedSystemsLastWeek;
    });

    this.apiService.getRetiredStandardsTotals().subscribe(totals => {
      this.retiredITStandardsLast6Months = totals.RetiredStandardsLastSixMonths;
      this.retiredITStandardsLast7Days = totals.RetiredStandardsLastWeek;
    });

    this.loadHostingPlatformsData();

    setTimeout(() => {
      this.updateChartViews();
      this.updateResponsiveChartHeights();
    }, 100);
  }

  public ngAfterViewInit(): void {
    setTimeout(() => {
      this.updateChartViews();
      this.setupResizeObserver();
      this.cdr.detectChanges();
    }, 200);
  }

  public ngOnDestroy(): void {
    if (this.sidebarSubscription) {
      this.sidebarSubscription.unsubscribe();
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  @HostListener('window:resize')
  onResize() {
    setTimeout(() => {
      this.updateChartViews();
      this.updateResponsiveChartHeights();
    }, 100);
  }

  private loadHostingPlatformsData(): void {
    this.apiService.getWebsites().subscribe(websites => {
      const activeBusinessWebsites = websites.filter(website => 
        website.production_status === 'production' && 
        (website.type_of_site === 'Application' || website.type_of_site === 'Application Login')
      );

      const platformCounts: { [key: string]: number } = {};
      
      activeBusinessWebsites.forEach(website => {
        if (website.hosting_platform) {
          let platform = website.hosting_platform.trim();
          if (platform === 'AWS (GovCloud)' || platform === 'AWS') {
            platform = 'AWS';
          }
          
          platformCounts[platform] = (platformCounts[platform] || 0) + 1;
        }
      });

      const allPlatforms = Object.entries(platformCounts)
        .map(([name, value]) => ({ name, value }));

      const platformsWithMultipleSystems = allPlatforms.filter(item => item.value > 1);
      const platformsWithSingleSystem = allPlatforms.filter(item => item.value === 1);

      const finalData = [...platformsWithMultipleSystems];
      
      if (platformsWithSingleSystem.length > 0) {
        const othersCount = platformsWithSingleSystem.length;
        finalData.push({ name: 'Others', value: othersCount });
      }

      finalData.sort((a, b) => b.value - a.value);

      this.hostingPlatformsData = [];
      this.cdr.detectChanges();
      
      setTimeout(() => {
        this.hostingPlatformsData = finalData;
        this.updateChartViews();
        this.cdr.detectChanges();
      }, 100);
    });
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
    setTimeout(() => {
      const barContainer = document.querySelector('.bar-chart-content');
      if (barContainer && barContainer.clientWidth > 0) {
        const barWidth = barContainer.clientWidth;
        const screenWidth = window.innerWidth;
        let barHeight = 350;
        
        if (screenWidth <= 1366 && screenWidth >= 992) {
          barHeight = 300;
        }
        
        this.barChartView = [barWidth, barHeight];
      } else {
        this.barChartView = [600, 350];
      }

      const pieContainer = document.querySelector('.pie-chart-content');
      if (pieContainer && pieContainer.clientWidth > 0) {
        const pieWidth = pieContainer.clientWidth;
        const screenWidth = window.innerWidth;
        let pieHeight = 280;
        
        if (screenWidth <= 1366 && screenWidth >= 992) {
          pieHeight = 220;
        }
        
        this.pieChartView = [pieWidth, pieHeight];
      } else {
        this.pieChartView = [400, 280];
      }

      this.cdr.detectChanges();
    }, 50);
  }

  public getExpiringDate(): string {
    const today = new Date();
    const threeMonthsFromNow = new Date(today.setMonth(today.getMonth() + 3));

    const day = threeMonthsFromNow.getDate();
    const month = threeMonthsFromNow.toLocaleString('default', { month: 'long' });

    return `${day}th ${month}`;
  }

  public navigateToCloudBasedSystems(): void {
    this.analyticsService.logClickEvent('/systems?tab=CloudEnabled', 'Dashboard business systems graph');
    this.router.navigate(['/systems'], { queryParams: { tab: 'Cloud Enabled' } });
  }

  public navigateToNonCloudBasedSystems(): void {
    this.analyticsService.logClickEvent('/systems?tab=Inactive', 'Dashboard business systems graph');
    this.router.navigate(['/systems'], { queryParams: { tab: 'Inactive' } });
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
    this.router.navigate(['/FISMA'], { queryParams: { expiringWithinDays: '7' } }); // expiring this week
  }
  public viewDecommissionedSystems(): void {
    this.analyticsService.logClickEvent('/systems', 'Dashboard decommissioned systems this week');
    this.router.navigate(['/systems'], { queryParams: { decommissionedWithinDays: '7' } }); // decommissioned this week
  }
  public viewExpiringITStandards(): void {
    this.analyticsService.logClickEvent('/it_standards', 'Dashboard IT standards expiring this week');
    this.router.navigate(['/it_standards'], { queryParams: { expiringWithinDays: '7' } }); // expiring this week
  }
  public viewRecentRetiredITStandards(): void {
    this.analyticsService.logClickEvent('/it_standards', 'Dashboard IT standards retired in past week');
    this.router.navigate(['/it_standards'], { queryParams: { retiredWithinDays: '7' } }); // retired this week
  }

  public onTableRowClick(rowData: any): void {
    this.router.navigate(['/it_standards', rowData.ID]);
  }
}