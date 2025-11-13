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
  selector: 'fisma-modal',
  templateUrl: './fisma-modal.component.html',
  styleUrls: ['./fisma-modal.component.css']
})
export class FismaModalComponent implements OnInit {

  fisma = <any>{};

  constructor(
    private location: Location,
    public modalService: ModalsService,
    private router: Router,
    private sharedService: SharedService,
    public tableService: TableService) { }

  ngOnInit(): void {
    this.modalService.currentFismaSys.subscribe(fisma => this.fisma = fisma);

    // $('#fismaSubSysTable').bootstrapTable($.extend(this.tableService.relSysTableOptions, {
    //   columns: this.tableService.relSysColumnDefs,
    //   data: [],
    // }));

    // // Method to handle click events on the Subsystems table
    // $(document).ready(
    //   $('#fismaSubSysTable').on('click-row.bs.table', function (e, row) {
    //     // Hide First Modal before showing new modal
    //     $('#fismaDetail').modal('hide');

    //     this.tableService.systemsTableClick(row);
    //   }.bind(this)
    //   ));

    // Revert back to overview tab when modal goes away
    $('#fismaDetail').on('hidden.bs.modal', function (e) {
      $("#fismaTabs li:first-child a").tab('show');

      // Change URL back without ID after closing Modal
      this.sharedService.removeIDfromURL();
    }.bind(this));
  }

}
