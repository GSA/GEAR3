import { Component, OnInit } from '@angular/core';

import { SharedService } from '../../services/shared/shared.service';
import { TableService } from '../../services/tables/table.service';

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
    private tableService: TableService) { }

  // Global Search Table Options
  tableOptions: {} = {
    advancedSearch: true,
    idTable: 'advSearchGlobalTable',
    buttonsClass: 'info',
    cache: true,
    classes: "table table-bordered table-striped table-hover table-dark clickable-table",
    showColumns: false,
    showExport: true,
    exportDataType: 'all',
    exportTypes: ['xlsx', 'pdf', 'csv', 'json', 'xml', 'txt', 'sql'],
    pagination: true,
    showPaginationSwitch: true,
    search: true,
    showSearchClearButton: true,
    searchOnEnterKey: true,
    sortName: 'Name',
    sortOrder: 'asc',
    showToggle: true
  };

  // Global Search Table Columns
  columnDefs: any[] = [{
    field: 'Keyname',
    title: 'Item Name',
    sortable: true
  },
  {
    field: 'Description',
    title: 'Description',
    sortable: true,
    formatter: this.sharedService.descFormatter
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
    
    $('#globalSearchTable').bootstrapTable($.extend(this.tableOptions, {
      columns: this.columnDefs,
      data: [],
    }));

    // Method to handle click events on the Global Search table
    $(document).ready(
      $('#globalSearchTable').on('click-row.bs.table', function (e, row) {
        this.tableService.globalSearchTableClick(row);
      }.bind(this)
    ));

  }

}
