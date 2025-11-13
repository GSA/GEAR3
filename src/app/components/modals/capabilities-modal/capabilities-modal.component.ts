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
  selector: 'capabilities-modal',
  templateUrl: './capabilities-modal.component.html',
  styleUrls: ['./capabilities-modal.component.css']
})
export class CapabilitiesModalComponent implements OnInit {

  capability = <any>{};

  constructor(
    private location: Location,
    public modalService: ModalsService,
    private router: Router,
    public sharedService: SharedService,
    public tableService: TableService) { }


  // Related Orgs Table Options
  relOrgsTableOptions: {} = this.tableService.createTableOptions({
    advancedSearch: true,
    idTable: 'RelOrgTable',
    classes: "table-hover table-dark clickable-table",
    showColumns: false,
    showExport: true,
    exportFileName: null,
    headerStyle: "bg-royal-blue",
    pagination: true,
    search: true,
    sortName: 'OrgSymbol',
    sortOrder: 'asc',
    showToggle: true,
    url: null
  });

  // Related Orgs Table Columns
  relOrgsColumnDefs: any[] = [{
    field: 'OrgSymbol',
    title: 'Org Symbol',
    sortable: true
  }, {
    field: 'Name',
    title: 'Organization Name',
    sortable: true
  }, {
    field: 'SSOName',
    title: 'SSO Name',
    sortable: true
  }, {
    field: 'TwoLetterOrgSymbol',
    title: 'Two Letter Org',
    sortable: true
  }, {
    field: 'TwoLetterOrgName',
    title: 'Two Letter Org Name',
    sortable: true
  }];


  ngOnInit(): void {
    this.modalService.currentCap.subscribe(capability => this.capability = capability);

    $('#capRelOrgsTable').bootstrapTable($.extend(this.relOrgsTableOptions, {
      columns: this.relOrgsColumnDefs,
      data: [],
    }));

    $('#capSupportSysTable').bootstrapTable($.extend(this.tableService.relSysTableOptions, {
      columns: this.tableService.relSysColumnDefs,
      data: [],
    }));

    const self = this;
    $(document).ready(() => {
      // Method to handle click events on the Related Orgs table
      $('#capRelOrgsTable').on('click-row.bs.table', function (e, row) {
        // Hide First Modal before showing new modal
        $('#capabilityDetail').modal('hide');
        self.tableService.orgsTableClick(row);
      }.bind(this));

      // Method to handle click events on the Supported Systems table
      $('#capSupportSysTable').on('click-row.bs.table', function (e, row) {
        // Hide First Modal before showing new modal
        $('#capabilityDetail').modal('hide');
        self.tableService.systemsTableClick(row);
      }.bind(this));
    });

    // Revert back to overview tab when modal goes away
    $('#capabilityDetail').on('hidden.bs.modal', function (e) {
      $("#capTabs li:first-child a").tab('show');

      // Change URL back without ID after closing Modal
      this.sharedService.removeIDfromURL();
    }.bind(this));
  }

  capabilityEdit () {
    // Hide Detail Modal before showing Manager Modal
    $('#capabilityDetail').modal('hide');
    this.modalService.updateDetails(this.capability, 'capability', false);
    this.sharedService.setCapabilityForm();
    $('#capabilityManager').modal('show');
  }

  showRelatedOrgsTab() {
    return $('#capRelOrgsTable').bootstrapTable('getData').length > 0;
  }

  showSupportingSystemsTab() {
    return $('#capSupportSysTable').bootstrapTable('getData').length > 0;
  }

}
