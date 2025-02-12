import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Column } from '@common/table-classes';
import { AnalyticsService } from '@services/analytics/analytics.service';
import { ApiService } from '@services/apis/api.service';

import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'global-search',
  templateUrl: './global-search.component.html',
  styleUrls: ['./global-search.component.css']
})
export class GlobalSearchComponent implements OnInit {

  public searchKW;
  tableData: any[] = [];
  tableDataOriginal: any[] = [];

  constructor(
    private sharedService: SharedService,
    private tableService: TableService,
    private route: ActivatedRoute,
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
      field: 'GEAR_Type_Display',
      header: 'GEAR Data Report',
      isSortable: true
    }];

    // Enable popovers
    $(function () {
      $('[data-toggle="popover"]').popover()
    })

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
        // $('#globalSearchTable').bootstrapTable('destroy');
        let kw = params['keyword'];
        this.apiService.getGlobalSearchResults(kw).subscribe(s => {
          this.tableService.updateReportTableData(s);
          this.tableData = s;
          this.tableDataOriginal = s;
        });
        // Log GA4 event
        this.analyticsService.logSearchEvent(kw);
      }
    });
  }
}
