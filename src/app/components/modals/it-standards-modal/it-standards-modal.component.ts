import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

import { ModalsService } from '@services/modals/modals.service';
import { SharedService } from "@services/shared/shared.service";
import { TableService } from '@services/tables/table.service';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'it-standards-modal',
  templateUrl: './it-standards-modal.component.html',
  styleUrls: ['./it-standards-modal.component.css']
})
export class ItStandardsModalComponent implements OnInit {

  itStandard = <any>{};

  constructor(
    private location: Location,
    private modalService: ModalsService,
    private router: Router,
    public sharedService: SharedService,
    private tableService: TableService) { }

  ngOnInit(): void {
    this.modalService.currentITStand.subscribe(itStandard => this.itStandard = itStandard);

    // $('#itRelSysTable').bootstrapTable($.extend(this.tableService.relSysTableOptions, {
    //   columns: this.tableService.relSysColumnDefs,
    //   data: [],
    // }));

    // // Method to handle click events on the Related Systems table
    // $(document).ready(
    //   $('#itStandRelatedSys').on('click-row.bs.table', function (e, row) {
    //     // Hide First Modal before showing new modal
    //     $('#itStandardDetail').modal('hide');

    //     this.tableService.systemsTableClick(row);
    //   }.bind(this)
    //   ));

    // Revert back to overview tab when modal goes away
    $('#itStandardDetail').on('hidden.bs.modal', function (e) {
      $("#itStandTabs li:first-child a").tab('show');

      // Change URL back without ID after closing Modal
      var truncatedURL = this.sharedService.coreURL(this.router.url);
      this.location.replaceState(truncatedURL);
    }.bind(this));
  }

  itStandEdit () {
    // Hide Detail Modal before showing Manager Modal
    $('#itStandardDetail').modal('hide');
    this.modalService.updateDetails(this.itStandard, 'it-standard');
    this.sharedService.setITStandardsForm();
    $('#itStandardsManager').modal('show');
  }

}
