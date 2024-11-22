import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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

  constructor(
    private sharedService: SharedService,
    private tableService: TableService,
    private route: ActivatedRoute,
    private apiService: ApiService,
    private analyticsService: AnalyticsService
  ) { }

  // Global Search Table Options
  tableOptions: any = this.tableService.createTableOptions({
    advancedSearch: true,
    idTable: 'GlobalTable',
    classes: "table-hover table-dark clickable-table fixed-table",
    showColumns: false,
    showExport: true,
    exportFileName: null,
    headerStyle: null,
    pagination: true,
    search: true,
    sortName: 'Name',
    sortOrder: 'asc',
    showToggle: true,
    url: null
  });

  // Global Search Table Columns
  columnDefs: any[] = [{
    field: 'Name',
    title: 'Item Name',
    sortable: true
  },
  {
    field: 'Description',
    title: 'Description',
    sortable: true,
    class: 'text-truncate'
  },
  {
    field: 'GEAR_Type',
    title: 'Type',
    sortable: true
  }];

  ngOnInit(): void {
    // Enable popovers
    $(function () {
      $('[data-toggle="popover"]').popover()
    })

    this.route.params.subscribe((params) => {
      //Disable table sticky header
      this.sharedService.disableStickyHeader("globalSearchTable");

      // If the user pastes in an open global search modal url
      if(params && (params['reportType'] && params['id'])) {  
        let searchData = {
          Id: params['id'],
          GEAR_Type: params['reportType']
        };
        this.tableService.globalSearchTableClick(searchData);
      }

      /* On global search destroy the original table
      *  so it doesn't cause an infinite loop when searching
      *  while already on the search page since the bootstrap
      *  table refresh method doesn't seem to work as expected.
      *  Set the filename and url using the keyword and recreate the table.
      */
      if(params && params['keyword']) {
        $('#globalSearchTable').bootstrapTable('destroy');
        let kw = params['keyword'];
        this.tableOptions.url = this.apiService.globalSearchUrl + kw;
        this.tableOptions.exportOptions.fileName = this.sharedService.fileNameFmt('GEAR_Global_Search-' + kw);
        $('#globalSearchTable').bootstrapTable($.extend(this.tableOptions, {
          columns: this.columnDefs,
          data: [],
        }));
        // Log GA4 event
        this.analyticsService.logSearchEvent(kw);
      }

      //Enable table sticky header
      this.sharedService.enableStickyHeader("globalSearchTable");
    });

    const self = this;
    $(document).ready(() => {
      // Method to handle click events on the Global Search table
      $('#globalSearchTable').on('click-row.bs.table', function (e, row) {
        this.tableService.globalSearchTableClick(row);
      }.bind(this));
  });

  }
}
