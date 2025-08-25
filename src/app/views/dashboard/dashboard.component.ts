import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { Column } from '@common/table-classes';
import { ApiService } from '@services/apis/api.service';
import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';

@Component({
    selector: 'dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
    standalone: false
})
export class DashboardComponent implements OnInit {

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

  // Hosting Platforms Bar Chart Data
  public hostingPlatformsData = [
    { name: 'AWS', value: 25 },
    { name: 'AWS (GovCloud)', value: 20 },
    { name: 'Cloud.gov', value: 10 },
    { name: 'FCS', value: 35 },
    { name: 'GSA', value: 75 },
    { name: 'GSA salesforce', value: 50 },
    { name: 'Others', value: 60 }
  ];

  // Cloud Business Systems Donut Chart Data
  public cloudBusinessSystemsData = [
    { name: 'Cloud Based', value: 231 },
    { name: 'Not Cloud Based', value: 58 }
  ];

  public totalBusinessSystems: number = 289;

  // Label formatting function for pie chart
  public labelFormatting = (value: any): string => {
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
    private router: Router
  ) { }

  public ngOnInit(): void {
    this.updateChartViews();
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

    // For now, using static values from the image until API endpoints are available
    this.decommissionedSystemsLast6Months = 156;
    this.decommissionedSystemsLast7Days = 33;
    this.decommissionedITStandardsLast6Months = 100;
    this.decommissionedITStandardsLast7Days = 15;
  }

  @HostListener('window:resize')
  onResize() {
    this.updateChartViews();
  }

  private updateChartViews() {
    // Update bar chart view
    const barContainer = document.querySelector('.bar-chart-content');
    if (barContainer) {
      const barWidth = barContainer.clientWidth;
      this.barChartView = [barWidth, 350];
    }

    // Update pie chart view
    const pieContainer = document.querySelector('.pie-chart-content');
    if (pieContainer) {
      const pieWidth = pieContainer.clientWidth;
      this.pieChartView = [pieWidth, 280];
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
    this.router.navigate(['/systems'], { queryParams: { tab: 'Decommissioned' } });
  }

  public navigateToDecommissionedITStandards(): void {
    this.router.navigate(['/it_standards'], { queryParams: { tab: 'Decommissioned' } });
  }

  public navigateToDecommissionedITStandardsTabs(): void {
    this.router.navigate(['/it_standards'], { queryParams: { tab: 'Decommissioned' } });
  }

  public onTableRowClick(rowData: any): void {
    this.router.navigate(['/it_standards', rowData.ID]);
  }
}