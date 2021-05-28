import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
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
    private modalService: ModalsService,
    private route: ActivatedRoute,
    private router: Router,
    public sharedService: SharedService,
    private tableService: TableService) { }

  ngOnInit(): void {
    this.modalService.currentRecord.subscribe(record => this.record = record);

    // Revert back to overview tab when modal goes away
    $('#recordDetail').on('hidden.bs.modal', function (e) {
      $("#recordTabs li:first-child a").tab('show');
      
      // Change URL back without ID after closing Modal
      var truncatedURL = this.sharedService.coreURL(this.router.url);
      this.location.replaceState(truncatedURL);
    }.bind(this));
  }

}