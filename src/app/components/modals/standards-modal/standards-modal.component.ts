import { Component, OnInit } from '@angular/core';

import { ModalsService } from '../../../services/modals/modals.service';
import { TableService } from '../../../services/tables/table.service';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'standards-modal',
  templateUrl: './standards-modal.component.html',
  styleUrls: ['./standards-modal.component.css']
})
export class StandardsModalComponent implements OnInit {

  itStandard = <any>{};

  constructor(
    private modalService: ModalsService,
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

}
