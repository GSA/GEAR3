import { Component, OnInit } from '@angular/core';

import { ApiService } from "@services/apis/api.service";
import { ModalsService } from '@services/modals/modals.service';
import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'records-management',
  templateUrl: './records-management.component.html',
  styleUrls: ['./records-management.component.css']
})
export class RecordsManagementComponent implements OnInit {

  constructor(
    private apiService: ApiService,
    private modalService: ModalsService,
    public sharedService: SharedService,
    private tableService: TableService) { }

  // Records Table Options
  tableOptions: {} = this.tableService.createTableOptions({
    advancedSearch: true,
    idTable: 'RecordsTable',
    classes: "table-hover table-dark clickable-table fixed-table",
    showColumns: true,
    showExport: true,
    exportFileName: 'GSA_Record_Schedules',
    headerStyle: "bg-danger",
    pagination: true,
    search: true,
    sortName: 'RecordTitle',
    sortOrder: 'asc',
    showToggle: true,
    url: this.apiService.recordsUrl
  });

  // Apps Table Columns
  columnDefs: any[] = [{
    field: 'RecordTitle',
    title: 'Title',
    sortable: true
  }, {
    field: 'Description',
    title: 'Description',
    sortable: false,
    class: 'text-truncate'
  }, {
    field: 'RecordFormat',
    title: 'Format',
    sortable: true
  }, {
    field: 'RecordLocation',
    title: 'Location',
    sortable: true
  }, {
    field: 'DispositionInstructions',
    title: 'Disposition Instructions',
    sortable: true
  }, {
    field: 'DispositionAuthority',
    title: 'Disposition Authority',
    sortable: true
  }, {
    field: 'GRSRecord',
    title: 'GRS Record',
    sortable: true
  }, {
    field: 'PII',
    title: 'PII',
    sortable: true
  }, {
    field: 'Subject',
    title: 'Subject',
    sortable: true
  }, {
    field: 'Notes',
    title: 'Notes',
    sortable: false,
    visible: false,
    class: 'text-truncate'
  }, {
    field: 'Org',
    title: 'Organization',
    sortable: true
  }, {
    field: 'POC',
    title: 'POC',
    sortable: true
  }];

  ngOnInit(): void {
    // Enable popovers
    $(function () {
      $('[data-toggle="popover"]').popover()
    })

    $('#recordsTable').bootstrapTable($.extend(this.tableOptions, {
      columns: this.columnDefs,
      data: [],
    }));

    // Method to handle click events on the Records table
    $(document).ready(
      $('#recordsTable').on('click-row.bs.table', function (e, row) {
        this.tableService.recordsTableClick(row);
      }.bind(this),
      ));
  }

}
