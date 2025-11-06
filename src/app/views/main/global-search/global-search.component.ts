import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Column } from '@common/table-classes';
import { AnalyticsService } from '@services/analytics/analytics.service';
import { ApiService } from '@services/apis/api.service';

import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';

@Component({
    selector: 'global-search',
    templateUrl: './global-search.component.html',
    styleUrls: ['./global-search.component.scss'],
    standalone: false
})
export class GlobalSearchComponent implements OnInit {

  public searchKW: string = '';
  tableData: any[] = [];
  tableDataOriginal: any[] = [];

  constructor(
    private sharedService: SharedService,
    private tableService: TableService,
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private analyticsService: AnalyticsService
  ) { }

  tableCols: Column[] = [];

  ngOnInit(): void {
    // Global Search Table Columns
    this.tableCols = [{
      field: 'Name',
      header: 'Item Name',
      isSortable: true
    },
    {
      field: 'Description',
      header: 'Description',
      isSortable: true,
      class: 'text-truncate',
      formatter: this.sharedService.formatDescription,
    },
    {
      field: 'Status',
      header: 'Status',
      isSortable: false,
      formatter: this.sharedService.formatStatus,
    },
    {
      field: 'GEAR_Type_Display',
      header: 'GEAR Data Report',
      isSortable: true
    }];

    this.route.params.subscribe((params) => {
      // If the user pastes in an open global search modal url
      if(params && (params['reportType'] && params['id'])) {  
        let searchData = {
          Id: params['id'],
          GEAR_Type: params['reportType']
        };
        this.tableService.globalSearchTableClick(searchData);
      }

      if(params && params['keyword']) {
        this.searchKW = params['keyword'];
        this.apiService.getGlobalSearchResults(this.searchKW).subscribe(s => {
          let sorted = this.sortBySearchTerm(s, this.searchKW, 'Name');
          this.tableService.updateReportTableData(sorted);
          this.tableData = sorted;
          this.tableDataOriginal = sorted;
        });
        // Log GA4 event
        this.analyticsService.logSearchEvent(this.searchKW);
      }
    });
  }

  public onRowClick(e: any): void {
    const data = e.data;
    switch (data.GEAR_Type) {
      case 'System':
        this.router.navigate(['/systems/', data.Id], { queryParams: { search: this.searchKW } });
        break;
      case 'FISMA':
        this.router.navigate(['/FISMA/', data.Id], { queryParams: { search: this.searchKW } });
        break;
      case 'Technology':
        this.router.navigate(['/it_standards/', data.Id], { queryParams: { search: this.searchKW } });
        break;
      case 'Capability':
        this.router.navigate(['/capabilities/', data.Id], { queryParams: { search: this.searchKW } });
        break;
      case 'Organization':
        this.router.navigate(['/organizations/', data.Id], { queryParams: { search: this.searchKW } });
        break;
      case 'Investment':
        this.router.navigate(['/investments/', data.Id], { queryParams: { search: this.searchKW } });
        break;
      case 'Website':
        this.router.navigate(['/websites/', data.Id], { queryParams: { search: this.searchKW } });
        break;
      default:
        break;
    }
  }

  private sortBySearchTerm(arr, searchTerm, key) {
    const matchFN = (item) => {
      const value = item[key];
      // if no direct match return 0
      if (!value) return 0;
      // if exact match make sure it goes to the top
      if(value.toLowerCase() === searchTerm.toLowerCase()) return arr.length + 1;
      const index = value.toLowerCase().indexOf(searchTerm.toLowerCase());
      return index === -1 ? 0 : 1 / (index + 1);
    }

    arr.sort((a, b) => matchFN(b) - matchFN(a));
    return arr;
  }
}