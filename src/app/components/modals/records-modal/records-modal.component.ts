import { Component, OnInit } from '@angular/core';

import { ApiService } from '@services/apis/api.service';
import { ModalsService } from '@services/modals/modals.service';
import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';

@Component({
  selector: 'records-modal',
  templateUrl: './records-modal.component.html',
  styleUrls: ['./records-modal.component.css']
})
export class RecordsModalComponent implements OnInit {

  record = <any>{};

  constructor(
    private apiService: ApiService,
    private modalService: ModalsService,
    public sharedService: SharedService,
    private tableService: TableService) { }

  ngOnInit(): void {
    this.modalService.currentRecord.subscribe(record => this.record = record);
  }

}
