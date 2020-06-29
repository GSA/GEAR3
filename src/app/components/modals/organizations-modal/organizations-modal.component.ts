import { Component, OnInit } from '@angular/core';

import { ModalsService } from '../../../services/modals/modals.service';
import { TableService } from '../../../services/tables/table.service';

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
    private modalService: ModalsService,
    private tableService: TableService) { }

  ngOnInit(): void {
    this.modalService.currentOrg.subscribe(organization => this.org = organization);

    $('#orgAppsTable').bootstrapTable($.extend(this.tableService.relAppsTableOptions, {
      columns: this.tableService.relAppsColumnDefs,
      data: [],
    }));

    // Method to handle click events on the Organizational Apps table
    $(document).ready(
      $('#orgAppsTable').on('click-row.bs.table', function (e, row) {
        // Hide First Modal before showing new modal
        $('#organizationDetail').modal('hide');

        this.tableService.appsTableClick(row);
      }.bind(this)
      ));
  }

}
