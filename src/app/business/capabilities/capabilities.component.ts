import { Component, OnInit } from '@angular/core';
import { formatDate } from '@angular/common';
import { Location } from '@angular/common';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'capabilities',
  templateUrl: './capabilities.component.html',
  styleUrls: ['./capabilities.component.css']
})
export class CapabilitiesComponent implements OnInit {

  constructor(
    private location: Location
  ) { }

  // Capabilities Table Options
  tableOptions: {} = {
    advancedSearch: true,
    idTable: 'advSearchCapsTable',
    buttonsClass: 'info',
    cache: true,
    classes: "table table-bordered table-striped table-hover table-dark",
    showColumns: false,
    showExport: true,
    exportDataType: 'all',
    exportOptions: {
      fileName: function () {
        // Append current date time to filename
        this.currentDate = formatDate(Date.now(), 'MMM_dd_yyyy-HH_mm', 'en-US');
        return 'GSA_Business_Capabilities-' + this.currentDate
      }
    },
    exportTypes: ['xlsx', 'pdf', 'csv', 'json', 'xml', 'txt', 'sql'],
    pagination: true,
    showPaginationSwitch: true,
    search: true,
    showSearchClearButton: true,
    searchOnEnterKey: true,
    sortName: 'ReferenceNum',
    sortOrder: 'asc',
    showToggle: true,
    url: this.location.prepareExternalUrl('/api/capabilities')
  };

  // Capabilities Table Columns
  columnDefs: any[] = [{
    field: 'ReferenceNum',
    title: 'Ref Id',
    sortable: true
  }, {
    field: 'Name',
    title: 'Function Name',
    sortable: true
  }, {
    field: 'Description',
    title: 'Description',
    sortable: true
  }, {
    field: 'Parent',
    title: 'Parent',
    sortable: true
  }];

  ngOnInit(): void {
    $('#capsTable').bootstrapTable($.extend(this.tableOptions, {
      columns: this.columnDefs,
      data: [],
    }));
  }

}
