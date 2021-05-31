import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

import { ModalsService } from '@services/modals/modals.service';
import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';

// Declare jQuery symbol
declare var $: any;

@Component({
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

  ngOnInit(): void {
    this.modalService.currentOrg.subscribe(organization => this.org = organization);

    $('#orgSysTable').bootstrapTable($.extend(this.tableService.relSysTableOptions, {
      columns: this.tableService.relSysColumnDefs,
      data: [],
    }));

    // Method to handle click events on the Organizational Systems table
    $(document).ready(
      $('#orgSysTable').on('click-row.bs.table', function (e, row) {
        // Hide First Modal before showing new modal
        $('#organizationDetail').modal('hide');

        this.tableService.systemsTableClick(row);
      }.bind(this)
      ));

    // Revert back to overview tab when modal goes away
    $('#organizationDetail').on('hidden.bs.modal', function (e) {
      $("#orgTabs li:first-child a").tab('show');

      // Change URL back without ID after closing Modal
      this.sharedService.removeIDfromURL();
    }.bind(this));
  }

}
