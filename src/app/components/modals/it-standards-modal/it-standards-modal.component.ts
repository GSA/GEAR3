import { Component, OnInit } from '@angular/core';

import { ModalsService } from '../../../services/modals/modals.service';
import { SharedService } from "../../../services/shared/shared.service";
import { TableService } from '../../../services/tables/table.service';

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
    private modalService: ModalsService,
    public sharedService: SharedService,
    private tableService: TableService) { }

  ngOnInit(): void {
    this.modalService.currentITStand.subscribe(itStandard => this.itStandard = itStandard);

    $('#itRelAppsTable').bootstrapTable($.extend(this.tableService.relAppsTableOptions, {
      columns: this.tableService.relAppsColumnDefs,
      data: [],
    }));

    // Method to handle click events on the Related Apps table
    $(document).ready(
      $('#itStandRelatedApps').on('click-row.bs.table', function (e, row) {
        // Hide First Modal before showing new modal
        $('#itStandardDetail').modal('hide');

        this.tableService.appsTableClick(row);
      }.bind(this)
      ));
  }

  itStandEdit () {
    // Hide Detail Modal before showing Manager Modal
    $('#itStandardDetail').modal('hide');
    this.sharedService.setITStandardsForm();
    this.modalService.updateDetails(this.itStandard, 'it-standard');
    $('#itStandardsManager').modal('show');
  }

}
