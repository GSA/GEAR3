import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';

import { ModalsService } from '../../services/modals/modals.service';
import { SharedService } from '../../services/shared/shared.service';
import { TableService } from '../../services/tables/table.service';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'time',
  templateUrl: './time.component.html',
  styleUrls: ['./time.component.css']
})
export class TimeComponent implements OnInit {

  row: Object = <any>{};

  constructor(
    private location: Location,
    private modalService: ModalsService,
    private sharedService: SharedService,
    private tableService: TableService) {
      this.modalService.currentSys.subscribe(row => this.row = row);
  }

  // TIME Table Options
  tableOptions: {} = {
    advancedSearch: true,
    idTable: 'advSearchTimeTable',
    buttonsClass: 'info',
    cache: true,
    classes: "table table-bordered table-striped table-hover table-dark clickable-table",
    showColumns: true,
    showExport: true,
    exportDataType: 'all',
    exportOptions: {
      fileName: this.sharedService.fileNameFmt('Business_App_TIME_Report')
    },
    exportTypes: ['xlsx', 'pdf', 'csv', 'json', 'xml', 'txt', 'sql'],
    headerStyle: function (column) {
      return { classes: 'bg-danger' }
    },
    pagination: true,
    showPaginationSwitch: true,
    search: true,
    showSearchClearButton: true,
    searchOnEnterKey: true,
    sortName: 'Name',
    sortOrder: 'asc',
    showToggle: true,
    url: this.location.prepareExternalUrl('/api/apptime')
  };

  // TIME Table Columns
  columnDefs: any[] = [{
    field: 'Name',
    title: 'Application Name',
    sortable: true
  }, {
    field: 'Alias',
    title: 'Alias',
    sortable: true,
    visible: false
  }, {
    field: 'SSO',
    title: 'SSO',
    visible: false,
    sortable: true
  }, {
    field: 'Owner',
    title: 'Two Letter Org (Short)',
    sortable: true,
  }, {
    field: 'OwnerLongName',
    title: 'Two Letter Org (Long)',
    visible: false,
    sortable: true
  }, {
    field: 'ParentSystem',
    title: 'Parent System',
    sortable: true,
    visible: false,
    formatter: this.sharedService.systemFormatter
  }, {
    field: 'CUI',
    title: 'CUI',
    sortable: true,
    visible: false
  }, {
    field: 'Status',
    title: 'Status',
    sortable: true
  }, {
    field: 'ProdYear',
    title: 'Production Year',
    sortable: true,
    visible: false
  }, {
    field: 'FY14',
    title: 'FY14',
    visible: false,
    formatter: this.sharedService.FYFormatter
  }, {
    field: 'FY15',
    title: 'FY15',
    visible: false,
    formatter: this.sharedService.FYFormatter
  }, {
    field: 'FY16',
    title: 'FY16',
    visible: false,
    formatter: this.sharedService.FYFormatter
  }, {
    field: 'FY17',
    title: 'FY17',
    visible: false,
    formatter: this.sharedService.FYFormatter
  }, {
    field: 'FY18',
    title: 'FY18',
    formatter: this.sharedService.FYFormatter
  }, {
    field: 'FY19',
    title: 'FY19',
    formatter: this.sharedService.FYFormatter
  }, {
    field: 'FY20',
    title: 'FY20',
    formatter: this.sharedService.FYFormatter
  }, {
    field: 'FY21',
    title: 'FY21',
    formatter: this.sharedService.FYFormatter
  }, {
    field: 'FY22',
    title: 'FY22',
    visible: false,
    formatter: this.sharedService.FYFormatter
  }, {
    field: 'FY23',
    title: 'FY23',
    visible: false,
    formatter: this.sharedService.FYFormatter
  }, {
    field: 'FY24',
    title: 'FY24',
    visible: false,
    formatter: this.sharedService.FYFormatter
  }, {
    field: 'FY25',
    title: 'FY25',
    visible: false,
    formatter: this.sharedService.FYFormatter
  }, {
    field: 'FY26',
    title: 'FY26',
    visible: false,
    formatter: this.sharedService.FYFormatter
  }, {
    field: 'Notes',
    title: 'Notes',
    visible: false,
    sortable: true
  }, {
    field: 'BusinessPOC',
    title: 'Business POC',
    visible: false,
    sortable: true
  }, {
    field: 'TechnicalPOC',
    title: 'Technical POC',
    visible: false,
    sortable: true
  }, {
    field: 'OMBUID',
    title: 'Application ID',
    sortable: true,
    visible: false
  }];

  ngOnInit(): void {
    // Enable popovers
    $(function () {
      $('[data-toggle="popover"]').popover()
    })
    
    $('#timeTable').bootstrapTable($.extend(this.tableOptions, {
      columns: this.columnDefs,
      data: [],
    }));

    // Method to handle click events on the Systems table
    $(document).ready(
      $('#timeTable').on('click-row.bs.table', function (e, row) {
        this.tableService.appsTableClick(row);
      }.bind(this)
    ));

  }

}
