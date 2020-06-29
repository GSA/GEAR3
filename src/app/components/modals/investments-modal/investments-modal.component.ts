import { Component, OnInit } from '@angular/core';

import { ModalsService } from '../../../services/modals/modals.service';
import { TableService } from '../../../services/tables/table.service';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'investments-modal',
  templateUrl: './investments-modal.component.html',
  styleUrls: ['./investments-modal.component.css']
})
export class InvestmentsModalComponent implements OnInit {

  investment = <any>{};

  constructor(
    private modalService: ModalsService,
    private tableService: TableService) { }

  ngOnInit(): void {
    this.modalService.currentInvest.subscribe(investment => this.investment = investment);

    $('#investRelAppsTable').bootstrapTable($.extend(this.tableService.relAppsTableOptions, {
      columns: this.tableService.relAppsColumnDefs,
      data: [],
    }));

    // Method to handle click events on the Related Apps table
    $(document).ready(
      $('#investRelAppsTable').on('click-row.bs.table', function (e, row) {
        // Hide First Modal before showing new modal
        $('#investDetail').modal('hide');

        this.tableService.appsTableClick(row);
      }.bind(this)
      ));
  }

}
