import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

import { ModalsService } from '@services/modals/modals.service';
import { SharedService } from "@services/shared/shared.service";
import { TableService } from '@services/tables/table.service';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'systems-modal',
  templateUrl: './systems-modal.component.html',
  styleUrls: ['./systems-modal.component.css']
})
export class SystemsModalComponent implements OnInit {

  system = <any>{};

  constructor(
    private location: Location,
    private modalService: ModalsService,
    private router: Router,
    public sharedService: SharedService,
    private tableService: TableService) { }

  ngOnInit(): void {
    this.modalService.currentSys.subscribe(system => this.system = system);

    $('#childAppsTable').bootstrapTable($.extend(this.tableService.relAppsTableOptions, {
      columns: this.tableService.relAppsColumnDefs,
      data: [],
    }));

    // Method to handle click events on the Child Apps table
    $(document).ready(
      $('#childAppsTable').on('click-row.bs.table', function (e, row) {
        // Hide First Modal before showing new modal
        $('#systemDetail').modal('hide');

        this.tableService.appsTableClick(row);
      }.bind(this)
      ));

    // Revert back to overview tab when modal goes away
    $('#systemDetail').on('hidden.bs.modal', function (e) {
      $("#systemTabs li:first-child a").tab('show');
      
      // Change URL back without ID after closing Modal
      var truncatedURL = this.sharedService.coreURL(this.router.url);
      this.location.replaceState(truncatedURL);
    }.bind(this));
  }

  systemEdit () {
    // Hide Detail Modal before showing Manager Modal
    $('#systemDetail').modal('hide');
    this.modalService.updateDetails(this.system, 'system');
    this.sharedService.setSystemForm();
    $('#systemManager').modal('show');
  }

}
