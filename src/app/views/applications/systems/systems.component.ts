import { Component, OnInit } from '@angular/core';

import { ApiService } from '@services/apis/api.service';
import { ModalsService } from '@services/modals/modals.service';
import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';

import { ParentSystem } from '@api/models/parentsystems.model';

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
    private apiService: ApiService,
    private modalService: ModalsService,
    public sharedService: SharedService,
    private tableService: TableService) {
    this.modalService.currentSys.subscribe(row => this.row = row);
  }

  // Systems Table Options
  tableOptions: {} = this.tableService.createTableOptions({
    advancedSearch: true,
    idTable: 'SystemTable',
    classes: "table-hover table-dark clickable-table fixed-table",
    showColumns: false,
    showExport: true,
    exportFileName: 'GSA_Parent_Systems',
    headerStyle: "bg-danger",
    pagination: true,
    search: true,
    sortName: 'Name',
    sortOrder: 'asc',
    showToggle: true,
    url: this.apiService.sysUrl
  });

  // Systems Table Columns
  columnDefs: any[] = [{
    field: 'Name',
    title: 'System Name',
    sortable: true
  }, {
    field: 'Description',
    title: 'Description',
    sortable: true,
    class: 'text-truncate'
  }, {
    field: 'SSO',
    title: 'SSO',
    sortable: true
  }];

  ngOnInit(): void {
    // Enable popovers
    $(function () {
      $('[data-toggle="popover"]').popover();
    });

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
