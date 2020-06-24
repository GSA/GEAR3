import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';

import { ModalsService } from '../../services/modals/modals.service';
import { SharedService } from '../../services/shared/shared.service';
import { TableService } from '../../services/tables/table.service';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'investments',
  templateUrl: './investments.component.html',
  styleUrls: ['./investments.component.css']
})
export class InvestmentsComponent implements OnInit {

  row: Object = <any>{};

  constructor(
    private location: Location,
    private modalService: ModalsService,
    private sharedService: SharedService,
    private tableService: TableService) {
      this.modalService.currentInvest.subscribe(row => this.row = row);
  }

  // Investment Table Options
  tableOptions: {} = {
    advancedSearch: true,
    idTable: 'advSearchInvestTable',
    buttonsClass: 'info',
    cache: true,
    classes: "table table-bordered table-striped table-hover table-dark clickable-table",
    showColumns: true,
    showExport: true,
    exportDataType: 'all',
    exportOptions: {
      fileName: this.sharedService.fileNameFmt('GSA_IT_Investments')
    },
    exportTypes: ['xlsx', 'pdf', 'csv', 'json', 'xml', 'txt', 'sql'],
    pagination: true,
    showPaginationSwitch: true,
    search: true,
    showSearchClearButton: true,
    searchOnEnterKey: true,
    sortName: 'Name',
    sortOrder: 'asc',
    showToggle: true,
    url: this.location.prepareExternalUrl('/api/investments')
  };

  // Investments Table Columns
  columnDefs: any[] = [{
    field: 'Name',
    title: 'Investment Name',
    sortable: true
  }, {
    field: 'Description',
    title: 'Description',
    sortable: true,
    formatter: this.sharedService.descFormatter
  }, {
    field: 'Type',
    title: 'Type',
    sortable: true
  }, {
    field: 'InvManager',
    title: 'Investment Manager',
    sortable: true
  }, {
    field: 'SSO',
    title: 'SSO',
    sortable: true
  }, {
    field: 'PSA',
    title: 'Primary Service Area',
    sortable: true
  }, {
    field: 'SSA',
    title: 'Secondary Service Area',
    sortable: true,
    visible: false
  }, {
    field: 'UII',
    title: 'Investment UII',
    sortable: true,
    visible: false
  }];

  ngOnInit(): void {
    // Enable popovers
    $(function () {
      $('[data-toggle="popover"]').popover()
    })

    $('#investTable').bootstrapTable($.extend(this.tableOptions, {
      columns: this.columnDefs,
      data: [],
    }));

    // Method to handle click events on the Investments table
    $(document).ready(
      $('#investTable').on('click-row.bs.table', function (e, row) {
        this.tableService.investTableClick(row);
      }.bind(this)
    ));

  }
  
}
