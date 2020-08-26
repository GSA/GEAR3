import { Component, OnInit } from '@angular/core';

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
    private tableService: TableService) { }

  // Global Search Table Options
  tableOptions: {} = this.tableService.createTableOptions({
    advancedSearch: true,
    idTable: 'GlobalTable',
    classes: "table-hover table-dark clickable-table",
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
    field: 'Keyname',
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
