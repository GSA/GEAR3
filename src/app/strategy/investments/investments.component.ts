import { Component, OnInit } from '@angular/core';
import { formatDate } from '@angular/common';
import { Location } from '@angular/common';

import { ModalsService } from '../../services/modals/modals.service';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'app-investments',
  templateUrl: './investments.component.html',
  styleUrls: ['./investments.component.css']
})
export class InvestmentsComponent implements OnInit {

  row: Object = <any>{};

  constructor(
    private location: Location,
    private modalService: ModalsService) {
    this.modalService.currentInvest.subscribe(row => this.row = row);
  }

  // Investment Table Options
  tableOptions: {} = {
    advancedSearch: true,
    idTable: 'advSearchInvestTable',
    buttonsClass: 'info',
    cache: true,
    classes: "table table-bordered table-striped table-hover table-dark",
    showColumns: true,
    showExport: true,
    exportDataType: 'all',
    exportOptions: {
      fileName: function () {
        // Append current date time to filename
        this.currentDate = formatDate(Date.now(), 'MMM_dd_yyyy-HH_mm', 'en-US');
        return 'GSA_IT_Investments-' + this.currentDate
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
    sortable: true
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
    $('#investTable').bootstrapTable($.extend(this.tableOptions, {
      columns: this.columnDefs,
      data: [],
    }));

    // Method to handle click events on the Investments table
    $(document).ready(
      $('#investTable').on('click-row.bs.table', function (e, row) {
        console.log("Investment Table Clicked Row: ", row);  // Debug

        this.modalService.updateDetails(row);
        $('#investDetail').modal('show');

        // Update related apps table in detail modal with clicked investment
        $('#investRelAppsTable').bootstrapTable('refreshOptions', {
          exportOptions: {
            fileName: function () {
              // Append current date time to filename
              this.currentDate = formatDate(Date.now(), 'MMM_dd_yyyy-HH_mm', 'en-US');
              return row.Name + '-Related_Apps-' + this.currentDate
            }
          },
          url: this.location.prepareExternalUrl('/api/investments/' 
            + String(row.ID) + '/applications')
        })

      }.bind(this)
    ));

  }
}
