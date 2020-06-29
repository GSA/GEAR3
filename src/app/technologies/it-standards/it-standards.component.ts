import { Component, OnInit } from '@angular/core';

import { ModalsService } from '../../services/modals/modals.service';
import { SharedService } from '../../services/shared/shared.service';
import { TableService } from '../../services/tables/table.service';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'it-standards',
  templateUrl: './it-standards.component.html',
  styleUrls: ['./it-standards.component.css']
})
export class ItStandardsComponent implements OnInit {

  row: Object = <any>{};
  filteredTable: boolean = false;

  constructor(
    private modalService: ModalsService,
    private sharedService: SharedService,
    private tableService: TableService) {
    this.modalService.currentITStand.subscribe(row => this.row = row);
  }

  // IT Standard Table Options
  tableOptions: {} = {
    advancedSearch: true,
    idTable: 'advSearchITStandardTable',
    buttonsClass: 'info',
    cache: true,
    classes: "table table-bordered table-striped table-hover table-dark clickable-table",
    showColumns: true,
    showExport: true,
    exportDataType: 'all',
    exportOptions: {
      fileName: this.sharedService.fileNameFmt('GSA_IT_Standards')
    },
    exportTypes: ['xlsx', 'pdf', 'csv', 'json', 'xml', 'txt', 'sql'],
    headerStyle: function (column) { return { classes: 'bg-teal' } },
    pagination: true,
    showPaginationSwitch: true,
    search: true,
    showSearchClearButton: true,
    searchOnEnterKey: true,
    sortName: 'Name',
    sortOrder: 'asc',
    showToggle: true,
    url: this.sharedService.internalURLFmt('/api/it_standards')
  };

  // IT Standard Table Columns
  columnDefs: any[] = [{
    field: 'Name',
    title: 'Standard Name',
    sortable: true
  }, {
    field: 'Description',
    title: 'Description',
    sortable: true,
    formatter: this.sharedService.descFormatter
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
    // Enable popovers
    $(function () {
      $('[data-toggle="popover"]').popover()
    })

    $('#itStandardsTable').bootstrapTable($.extend(this.tableOptions, {
      columns: this.columnDefs,
      data: [],
    }));

    // Method to handle click events on the Investments table
    $(document).ready(
      $('#itStandardsTable').on('click-row.bs.table', function (e, row) {
        this.tableService.itStandTableClick(row);
      }.bind(this)
      ));

  }

  // Update table from filter buttons
  changeFilter(field: string, term: string) {
    this.filteredTable = true;  // Filters are on, expose main table button
    var filter = {};
    filter[field] = term;

    // Set cloud field to visible if filtering by cloud enabled
    $('#itStandardsTable').bootstrapTable('filterBy', filter);
    $('#itStandardsTable').bootstrapTable('refreshOptions', {
      exportOptions: {
        fileName: this.sharedService.fileNameFmt('GSA_' + term + '_IT_Standards')
      }
    })
  }

  backToMainIT() {
    this.filteredTable = false;  // Hide main button

    // Remove filters and back to default
    $('#itStandardsTable').bootstrapTable('filterBy', {});
    $('#itStandardsTable').bootstrapTable('refreshOptions', {
      exportOptions: {
        fileName: this.sharedService.fileNameFmt('GSA_IT_Standards')
      }
    });
  }

}
