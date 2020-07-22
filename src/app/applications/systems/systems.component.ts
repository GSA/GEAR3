import { Component, OnInit } from '@angular/core';

import { ModalsService } from '../../services/modals/modals.service';
import { SharedService } from '../../services/shared/shared.service';
import { TableService } from '../../services/tables/table.service';

import { ParentSystem } from 'api/models/parentsystems.model';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'systems',
  templateUrl: './systems.component.html',
  styleUrls: ['./systems.component.css']
})
export class SystemsComponent implements OnInit {

  row: Object = <any>{};
  retiredTable: boolean = false;

  constructor(
    private modalService: ModalsService,
    public sharedService: SharedService,
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

    // Filter to only active parent systems
    $(document).ready(
      $('#systemTable').bootstrapTable('filterBy', { Status: 'Active' })
    );

    // Method to handle click events on the Systems table
    $(document).ready(
      $('#systemTable').on('click-row.bs.table', function (e, row) {
        this.tableService.systemsTableClick(row);
      }.bind(this)
      ));

  }

  // Create new parent system when in GEAR Manager mode
  createParentSystem() {
    var emptySystem = new ParentSystem();

    // By default, set new record to active
    emptySystem.Status = 'Active';
    this.modalService.updateRecordCreation(true);
    this.sharedService.setSystemForm();
    this.modalService.updateDetails(emptySystem, 'system');
    $('#systemManager').modal('show');
  }

  // Update table from filter buttons
  retiredFilter() {
    this.retiredTable = true;  // Filters are on, expose main table button

    $('#systemTable').bootstrapTable('filterBy', { Status: 'Retired' });
    $('#systemTable').bootstrapTable('refreshOptions', {
      exportOptions: {
        fileName: this.sharedService.fileNameFmt('GSA_Inactive_Parent_Systems')
      }
    })
  }

  backToMainSystem() {
    this.retiredTable = false;  // Hide main button

    // Remove filters and back to default
    $('#systemTable').bootstrapTable('filterBy', { Status: 'Active' });
    $('#systemTable').bootstrapTable('refreshOptions', {
      exportOptions: {
        fileName: this.sharedService.fileNameFmt('GSA_Parent_Systems')
      }
    });
  }

}
