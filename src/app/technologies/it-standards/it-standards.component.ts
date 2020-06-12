import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';

import { ModalsService } from '../../services/modals/modals.service';
import { SharedService } from '../../services/shared/shared.service';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'it-standards',
  templateUrl: './it-standards.component.html',
  styleUrls: ['./it-standards.component.css']
})
export class ItStandardsComponent implements OnInit {

  row: Object = <any>{};

  constructor(
    private location: Location,
    private sharedService: SharedService,
    private modalService: ModalsService) {
      this.modalService.currentITStand.subscribe(row => this.row = row);
  }

  // IT Standard Table Options
  tableOptions: {} = {
    advancedSearch: true,
    idTable: 'advSearchITStandardTable',
    buttonsClass: 'info',
    cache: true,
    classes: "table table-bordered table-striped table-hover table-dark",
    showColumns: true,
    showExport: true,
    exportDataType: 'all',
    exportOptions: {
      fileName: this.sharedService.fileNameFmt('GSA_IT_Standards')
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
    url: this.location.prepareExternalUrl('/api/it_standards')
  };

  // IT Standard Table Columns
  columnDefs: any[] = [{
    field: 'Name',
    title: 'Standard Name',
    sortable: true
  }, {
    field: 'Description',
    title: 'Description',
    sortable: true
  }, {
    field: 'Category',
    title: 'Category',
    sortable: true
  }, {
    field: 'Status',
    title: 'Status',
    sortable: true
  }, {
    field: 'DeploymentType',
    title: 'Deployment Type',
    sortable: true
  }, {
    field: 'POC',
    title: 'POC',
    sortable: true,
    visible: false
  }, {
    field: 'POCorg',
    title: 'POC Org',
    sortable: true,
    visible: false
  }, {
    field: 'Comments',
    title: 'Comments',
    sortable: true
  }, {
    field: 'ReferenceDocuments',
    title: 'Reference Documents',
    sortable: true,
    visible: false
  }, {
    field: 'ApprovalExpirationDate',
    title: 'Approval Expiration Date',
    sortable: true,
    visible: false
  }];

  ngOnInit(): void {
    $('#itStandardsTable').bootstrapTable($.extend(this.tableOptions, {
      columns: this.columnDefs,
      data: [],
    }));

    // Method to handle click events on the Investments table
    $(document).ready(
      $('#itStandardsTable').on('click-row.bs.table', function (e, row) {
        // console.log("IT Standard Table Clicked Row: ", row);  // Debug

        this.modalService.updateDetails(row, 'it-standard');
        $('#itStandardDetail').modal('show');

        // Update related apps table in detail modal with clicked investment
        $('#itRelAppsTable').bootstrapTable('refreshOptions', {
          exportOptions: {
            fileName: this.sharedService.fileNameFmt(row.Name + '-Related_Apps')
          },
          url: this.location.prepareExternalUrl('/api/it_standards/' 
            + String(row.ID) + '/applications')
        })

      }.bind(this)
    ));

  }

}
