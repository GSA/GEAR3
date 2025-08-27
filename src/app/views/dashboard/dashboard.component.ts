import { Component, OnInit, HostListener, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Column } from '@common/table-classes';
import { ApiService } from '@services/apis/api.service';
import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';
import { Website } from '@api/models/websites.model';

@Component({
    selector: 'dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
    standalone: false
})
export class DashboardComponent implements OnInit, AfterViewInit {

  public showTable = false;

  // Chart properties
  public chartView: [number, number] = [0, 400];
  public barChartView: [number, number] = [0, 350];
  public pieChartView: [number, number] = [0, 280];
  
  public colorScheme = {
    domain: ['#1f77b4', '#17becf', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b']
  };
  public pieColorScheme = {
    domain: ['#4CAF50', '#FF6B35']
  };

  // Hosting Platforms Bar Chart Data - now dynamic
  public hostingPlatformsData: any[] = [];

  // Cloud Business Systems Donut Chart Data
  public cloudBusinessSystemsData = [
    { name: 'Cloud Based', value: 0 },
    { name: 'Not Cloud Based', value: 0 }
  ];

  public totalBusinessSystems: number = 0;

  // Label formatting function for pie chart
  public labelFormatting = (value: any): string => {
    return value;
  };

  // X-axis tick formatting function for bar chart
  public xAxisTickFormatting = (value: string): string => {
    // Truncate long platform names to fit better on x-axis
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

  public standardsExpiringThisQuarter: number = 0;
  public standardsExpiringThisWeek: number = 0;

  public fismaExpiringThisQuarter: number = 0;
  public fismaExpiringThisWeek: number = 0;

  public decommissionedSystemsLast6Months: number = 0;
  public decommissionedSystemsLast7Days: number = 0;

  public decommissionedITStandardsLast6Months: number = 0;
  public decommissionedITStandardsLast7Days: number = 0;
  
 constructor(
    private apiService: ApiService,
    private tableService: TableService,
    private sharedService: SharedService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  public ngOnInit(): void {
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

    // Get cloud adoption data for the pie chart
    this.apiService.getCloudAdoptionRate().subscribe(cloudData => {
      if (cloudData && cloudData.length > 0) {
        const latestData = cloudData[0]; // Get the most recent data
        this.cloudBusinessSystemsData = [
          { name: 'Cloud Based', value: latestData.CloudBusSystemsCount },
          { name: 'Not Cloud Based', value: latestData.BusSystemsCount - latestData.CloudBusSystemsCount }
        ];
        this.totalBusinessSystems = latestData.BusSystemsCount;
      }
    });

    // Get hosting platforms data for the bar chart
    this.loadHostingPlatformsData();

    // For now, using static values from the image until API endpoints are available
    this.decommissionedSystemsLast6Months = 156;
    this.decommissionedSystemsLast7Days = 33;
    this.decommissionedITStandardsLast6Months = 100;
    this.decommissionedITStandardsLast7Days = 15;

    // Update chart views after a delay to ensure DOM is ready
    setTimeout(() => {
      this.updateChartViews();
    }, 100);
  }

  public ngAfterViewInit(): void {
    // Force chart resize after view is initialized
    setTimeout(() => {
      this.updateChartViews();
      this.cdr.detectChanges();
    }, 200);
  }

  @HostListener('window:resize')
  onResize() {
    this.updateChartViews();
  }

  private loadHostingPlatformsData(): void {
    this.apiService.getWebsites().subscribe(websites => {
      // Filter for active business applications
      const activeBusinessWebsites = websites.filter(website => 
        website.production_status === 'production' && 
        (website.type_of_site === 'Application' || website.type_of_site === 'Application Login')
      );

      // Group by hosting platform and count
      const platformCounts: { [key: string]: number } = {};
      
      activeBusinessWebsites.forEach(website => {
        if (website.hosting_platform) {
          // Combine AWS and AWS (GovCloud) into one bar
          let platform = website.hosting_platform.trim();
          if (platform === 'AWS (GovCloud)' || platform === 'AWS') {
            platform = 'AWS';
          }
          
          platformCounts[platform] = (platformCounts[platform] || 0) + 1;
        }
      });

      // Create array with all platforms including "Others" for single systems
      const allPlatforms = Object.entries(platformCounts)
        .map(([name, value]) => ({ name, value }));

      // Separate platforms with count > 1 and count = 1
      const platformsWithMultipleSystems = allPlatforms.filter(item => item.value > 1);
      const platformsWithSingleSystem = allPlatforms.filter(item => item.value === 1);

      // Create final array with individual platforms (count > 1) and "Others" (count = 1)
      const finalData = [...platformsWithMultipleSystems];
      
      // Add "Others" bar if there are platforms with single systems
      if (platformsWithSingleSystem.length > 0) {
        const othersCount = platformsWithSingleSystem.length;
        finalData.push({ name: 'Others', value: othersCount });
      }

      // Sort the final array by value in descending order (most systems on the left)
      finalData.sort((a, b) => b.value - a.value);

      // Force chart re-render by temporarily clearing data
      this.hostingPlatformsData = [];
      this.cdr.detectChanges();
      
      // Set the actual data after a brief delay
      setTimeout(() => {
        this.hostingPlatformsData = finalData;
        this.updateChartViews();
        this.cdr.detectChanges();
      }, 100);
    });
  }

  private updateChartViews() {
    // Update bar chart view
    const barContainer = document.querySelector('.bar-chart-content');
    if (barContainer && barContainer.clientWidth > 0) {
      const barWidth = barContainer.clientWidth;
      this.barChartView = [barWidth, 350];
    } else {
      // Fallback to default size if container not ready
      this.barChartView = [600, 350];
    }

    // Update pie chart view
    const pieContainer = document.querySelector('.pie-chart-content');
    if (pieContainer && pieContainer.clientWidth > 0) {
      const pieWidth = pieContainer.clientWidth;
      this.pieChartView = [pieWidth, 280];
    } else {
      // Fallback to default size if container not ready
      this.pieChartView = [400, 280];
    }
  }

  public getExpiringDate(): string {
    const today = new Date();
    const threeMonthsFromNow = new Date(today.setMonth(today.getMonth() + 3));

    const day = threeMonthsFromNow.getDate();
    const month = threeMonthsFromNow.toLocaleString('default', { month: 'long' });

    return `${day}th ${month}`;
  }

  // Navigation methods for charts
  public navigateToHostingPlatforms(): void {
    // Navigate to hosting platforms page or systems page
    this.router.navigate(['/systems']);
  }

  public navigateToCloudSystems(): void {
    // Navigate to cloud systems page or systems page
    this.router.navigate(['/systems']);
  }

  public navigateToCloudBasedSystems(): void {
    // Navigate to systems page with Cloud Enabled tab
    this.router.navigate(['/systems'], { queryParams: { tab: 'Cloud Enabled' } });
  }

  public navigateToNonCloudBasedSystems(): void {
    // Navigate to systems page with Inactive tab
    this.router.navigate(['/systems'], { queryParams: { tab: 'Inactive' } });
  }

  public onPieChartSelect(event: any): void {
    // Handle pie chart segment click
    if (event && event.name) {
      if (event.name === 'Cloud Based') {
        this.navigateToCloudBasedSystems();
      } else if (event.name === 'Not Cloud Based') {
        this.navigateToNonCloudBasedSystems();
      }
    }
  }

  public navigateToFisma(): void {
    this.router.navigate(['/FISMA']);
  }
   public navigateToFismaTabs(): void {
    this.router.navigate(['/FISMA'], { queryParams: { tab: 'Retired' } });
  }

  public navigateToItStandards(): void {
    this.router.navigate(['/it_standards']);
  }
  public navigateToItStandardTabs(): void {
    this.router.navigate(['/it_standards'], { queryParams: { tab: 'Retired' } });
  }

  public navigateToSystems(): void {
    this.router.navigate(['/systems']);
  }

  public navigateToSystemsTabs(): void {
    this.router.navigate(['/systems'], { queryParams: { tab: 'Inactive' } });
  }

  public navigateToDecommissionedITStandards(): void {
    this.router.navigate(['/it_standards'], { queryParams: { tab: 'Denied' } });
  }

  public navigateToDecommissionedITStandardsTabs(): void {
    this.router.navigate(['/it_standards'], { queryParams: { tab: 'Retired' } });
  }

  public onTableRowClick(rowData: any): void {
    this.router.navigate(['/it_standards', rowData.ID]);
  }
}