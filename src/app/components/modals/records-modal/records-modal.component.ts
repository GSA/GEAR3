import { PLATFORM_ID, Component, OnInit, Inject } from '@angular/core';
import { isPlatformBrowser, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { ApiService } from '@services/apis/api.service';
import { ModalsService } from '@services/modals/modals.service';
import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'records-modal',
  templateUrl: './records-modal.component.html',
  styleUrls: ['./records-modal.component.css']
})
export class RecordsModalComponent implements OnInit {

  record = <any>{};

  constructor(
    private apiService: ApiService,
    private location: Location,
    public modalService: ModalsService,
    private route: ActivatedRoute,
    private router: Router,
    public sharedService: SharedService,
    public tableService: TableService,
    @Inject(PLATFORM_ID) private platformId: Object) { }

  ngOnInit(): void {
    this.modalService.currentRecord.subscribe(record => this.record = record);
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    $('#recordsRelSysTable').bootstrapTable($.extend(this.tableService.relSysTableOptions, {
      columns: this.tableService.relSysColumnDefs,
      data: []
    }));

    const self = this;
    $(document).ready( () => {
      // Method to handle click events on the Related Systems table
      $('#recordsRelSysTable').on('click-row.bs.table', function (e, row) {
        // Hide First Modal before showing new modal
        $('#recordDetail').modal('hide');
        self.tableService.systemsTableClick(row);
      }.bind(this));
    });

    // Revert back to overview tab when modal goes away
    $('#recordDetail').on('hidden.bs.modal', function (e) {
      $("#recordTabs li:first-child a").tab('show');
      
      // Change URL back without ID after closing Modal
      this.sharedService.removeIDfromURL();
    }.bind(this));
  }

  recordEdit () {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    // Hide Detail Modal before showing Manager Modal
    $('#recordDetail').modal('hide');
    this.modalService.updateDetails(this.record, 'record', false);
    this.sharedService.setRecordForm();
    $('#recordManager').modal('show');
  }
}