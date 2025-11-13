import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

import { ModalsService } from '@services/modals/modals.service';
import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';

// Declare jQuery symbol
declare var $: any;

@Component({
standalone: false,
  selector: 'organizations-modal',
  templateUrl: './organizations-modal.component.html',
  styleUrls: ['./organizations-modal.component.css']
})
export class OrganizationsModalComponent implements OnInit {

  org = <any>{};

  constructor(
    private location: Location,
    public modalService: ModalsService,
    private router: Router,
    private sharedService: SharedService,
    public tableService: TableService) { }


  // Related Capabilities Table Options
  relCapsTableOptions: {} = this.tableService.createTableOptions({
    advancedSearch: true,
    idTable: null,
    classes: "table-hover table-dark clickable-table fixed-table",
    showColumns: false,
    showExport: true,
    exportFileName: null,
    headerStyle: "bg-royal-blue",
    pagination: true,
    search: true,
    sortName: 'ReferenceNum',
    sortOrder: 'asc',
    showToggle: true,
    url: null
  });

  // Related Capabilities Table Columns
  relCapsColumnDefs: any[] = [{
    field: 'ReferenceNum',
    title: 'Ref Id',
    sortable: true
  }, {
    field: 'Name',
    title: 'Capability Name',
    sortable: true
  }, {
    field: 'Description',
    title: 'Description',
    sortable: true,
    class: 'text-truncate'
  }, {
    field: 'Level',
    title: 'Level',
    sortable: true
  }, {
    field: 'Parent',
    title: 'Parent',
    sortable: true
  }];


  ngOnInit(): void {
    this.modalService.currentOrg.subscribe(organization => {
      this.org = organization;
    });

    $('#orgCapsTable').bootstrapTable($.extend(this.relCapsTableOptions, {
      columns: this.relCapsColumnDefs,
      data: [],
    }));

    $('#orgSysTable').bootstrapTable($.extend(this.tableService.relSysTableOptions, {
      columns: this.tableService.relSysColumnDefs,
      data: [],
    }));

    const self = this;
    $(document).ready(() => {
      // Method to handle click events on the Organizational Systems table
      $('#orgCapsTable').on('click-row.bs.table', function (e, row) {
        // Hide First Modal before showing new modal
        $('#organizationDetail').modal('hide');
        self.tableService.capsTableClick(row);
      }.bind(this));

      // Method to handle click events on the Organizational Systems table
      $('#orgSysTable').on('click-row.bs.table', function (e, row) {
        // Hide First Modal before showing new modal
        $('#organizationDetail').modal('hide');
        self.tableService.systemsTableClick(row);
      }.bind(this));
    });

    // Revert back to overview tab when modal goes away
    $('#organizationDetail').on('hidden.bs.modal', function (e) {
      $("#orgTabs li:first-child a").tab('show');
      // Change URL back without ID after closing Modal
      this.sharedService.removeIDfromURL();
    }.bind(this));

  }

  showRelatedCapsTab() {
    return $('#orgCapsTable').bootstrapTable('getData').length > 0;
  }

  showOrgSystemsTab() {
    return $('#orgSysTable').bootstrapTable('getData').length > 0;
  }
}
