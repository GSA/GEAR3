import { Component, OnInit } from '@angular/core';

import { ModalsService } from '../../services/modals/modals.service';
import { SharedService } from '../../services/shared/shared.service';
import { TableService } from '../../services/tables/table.service';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'systems',
  templateUrl: './systems.component.html',
  styleUrls: ['./systems.component.css']
})
export class SystemsComponent implements OnInit {

  row: Object = <any>{};

  constructor(
    private modalService: ModalsService,
    private sharedService: SharedService,
    private tableService: TableService) {
    this.modalService.currentSys.subscribe(row => this.row = row);
  }

  // Systems Table Options
  tableOptions: {} = {
    advancedSearch: true,
    idTable: 'advSearchSystemTable',
    buttonsClass: 'info',
    cache: true,
    classes: "table table-bordered table-striped table-hover table-dark clickable-table",
    showColumns: false,
    showExport: true,
    exportDataType: 'all',
    exportOptions: {
      fileName: this.sharedService.fileNameFmt('GSA_Parent_Systems')
    },
    exportTypes: ['xlsx', 'pdf', 'csv', 'json', 'xml', 'txt', 'sql'],
    headerStyle: function (column) { return { classes: 'bg-danger' } },
    pagination: true,
    showPaginationSwitch: true,
    search: true,
    showSearchClearButton: true,
    searchOnEnterKey: true,
    sortName: 'Name',
    sortOrder: 'asc',
    showToggle: true,
    url: this.sharedService.internalURLFmt('/api/parentsystems')
  };

  // Systems Table Columns
  columnDefs: any[] = [{
    field: 'Name',
    title: 'System Name',
    sortable: true
  }, {
    field: 'Description',
    title: 'Description',
    sortable: true,
    formatter: this.sharedService.descFormatter
  }, {
    field: 'SSO',
    title: 'SSO',
    sortable: true
  }];

  ngOnInit(): void {
    // Enable popovers
    $(function () {
      $('[data-toggle="popover"]').popover()
    })

    $('#systemTable').bootstrapTable($.extend(this.tableOptions, {
      columns: this.columnDefs,
      data: [],
    }));

    // Method to handle click events on the Systems table
    $(document).ready(
      $('#systemTable').on('click-row.bs.table', function (e, row) {
        this.tableService.systemsTableClick(row);
      }.bind(this)
      ));

  }

}
