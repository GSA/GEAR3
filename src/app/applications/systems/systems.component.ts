import { Component, OnInit } from '@angular/core';
import { formatDate } from '@angular/common';
import { Location } from '@angular/common';

import { ModalsService } from '../../services/modals/modals.service';

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
    private location: Location,
    private modalService: ModalsService) {
    this.modalService.currentSys.subscribe(row => this.row = row);
  }

  // Systems Table Options
  tableOptions: {} = {
    advancedSearch: true,
    idTable: 'advSearchSystemTable',
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
        return 'GSA_Parent_Systems-' + this.currentDate
      }
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
    url: this.location.prepareExternalUrl('/api/parentsystems')
  };

  // Systems Table Columns
  columnDefs: any[] = [{
    field: 'Name',
    title: 'System Name',
    sortable: true
  }, {
    field: 'Description',
    title: 'Description',
    sortable: true
  }, {
    field: 'SSO',
    title: 'SSO',
    sortable: true
  }];

  ngOnInit(): void {
    $('#systemTable').bootstrapTable($.extend(this.tableOptions, {
      columns: this.columnDefs,
      data: [],
    }));

    // Method to handle click events on the Systems table
    $(document).ready(
      $('#systemTable').on('click-row.bs.table', function (e, row) {
        // console.log("Parent Systems Table Clicked Row: ", row);  // Debug

        this.modalService.updateDetails(row, 'system');
        $('#systemDetail').modal('show');

        // Update related apps table in detail modal with clicked parent system
        $('#childAppsTable').bootstrapTable('refreshOptions', {
          exportOptions: {
            fileName: function () {
              // Append current date time to filename
              this.currentDate = formatDate(Date.now(), 'MMM_dd_yyyy-HH_mm', 'en-US');
              return row.Name + '-Child_Apps-' + this.currentDate
            }
          },
          url: this.location.prepareExternalUrl('/api/parentsystems/' 
            + String(row.ID) + '/applications')
        })

      }.bind(this)
    ));

  }

}
