import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

import { ModalsService } from '@services/modals/modals.service';
import { SharedService } from "@services/shared/shared.service";
import { TableService } from '@services/tables/table.service';

// Declare jQuery symbol
declare var $: any;

@Component({
    selector: 'investments-modal',
    templateUrl: './investments-modal.component.html',
    styleUrls: ['./investments-modal.component.css'],
    standalone: false
})
export class InvestmentsModalComponent implements OnInit {

  investment = <any>{};

  constructor(
    private location: Location,
    public modalService: ModalsService,
    private router: Router,
    public sharedService: SharedService,
    public tableService: TableService) { }

  ngOnInit(): void {
    this.modalService.currentInvest.subscribe(investment => this.investment = investment);

    $('#investRelSysTable').bootstrapTable($.extend(this.tableService.relSysTableOptions, {
      columns: this.tableService.relSysColumnDefs,
      data: [],
    }));

    const self = this;
    $(document).ready(() => {
      // Method to handle click events on the Related Systems table
      $('#investRelSysTable').on('click-row.bs.table', function (e, row) {
        // Hide First Modal before showing new modal
        $('#investDetail').modal('hide');

        self.tableService.systemsTableClick(row);
      }.bind(this));
    });

    // Revert back to overview tab when modal goes away
    $('#investDetail').on('hidden.bs.modal', function (e) {
      $("#investTabs li:first-child a").tab('show');
      
      // Change URL back without ID after closing Modal
      this.sharedService.removeIDfromURL();
    }.bind(this));
  }

  showRelatedSystemsTab() {
    return $('#investRelSysTable').bootstrapTable('getData').length > 0;
  }

}
