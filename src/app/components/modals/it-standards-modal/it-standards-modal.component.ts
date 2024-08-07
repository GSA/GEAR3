import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

import { ModalsService } from '@services/modals/modals.service';
import { SharedService } from "@services/shared/shared.service";
import { TableService } from '@services/tables/table.service';
import { ApiService } from '@services/apis/api.service';
import { TechAttributeDefinitions } from '@api/models/tech-attribute-definitions';
import { DataDictionary } from '@api/models/data-dictionary.model';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'it-standards-modal',
  templateUrl: './it-standards-modal.component.html',
  styleUrls: ['./it-standards-modal.component.css']
})
export class ItStandardsModalComponent implements OnInit {

  itStandard = <any>{};
  attrDefinitions = <DataDictionary[]>[];

  constructor(
    private location: Location,
    public modalService: ModalsService,
    private router: Router,
    public sharedService: SharedService,
    public tableService: TableService,
    public apiService: ApiService) { }

  ngOnInit(): void {
    this.modalService.currentITStand.subscribe(itStandard => this.itStandard = itStandard);

    $('#itRelSysTable').bootstrapTable($.extend(this.tableService.relSysTableOptions, {
      columns: this.tableService.relSysColumnDefs,
      data: [],
    }));

    const self = this;
    // Method to handle click events on the Related Systems table
    $(document).ready(() => {
      $('#itRelSysTable').on('click-row.bs.table', function (e, row) {
        // Hide First Modal before showing new modal
        $('#itStandardDetail').modal('hide');

        self.tableService.systemsTableClick(row);
      }.bind(this));
    });

    // Revert back to overview tab when modal goes away
    $('#itStandardDetail').on('hidden.bs.modal', function (e) {
      $("#itStandTabs li:first-child a").tab('show');

      // Change URL back without ID after closing Modal
      this.sharedService.removeIDfromURL();
    }.bind(this));

    // Get attribute definition list
    this.apiService.getDataDictionaryByReportName('IT Standards List')
      .subscribe((data: DataDictionary[]) => {
        this.attrDefinitions = data;
        
    });
  }

  itStandEdit () {
    // Hide Detail Modal before showing Manager Modal
    $('#itStandardDetail').modal('hide');
    this.modalService.updateDetails(this.itStandard, 'it-standard', false);
    this.sharedService.setITStandardsForm();
    $('#itStandardsManager').modal('show');
  }

  
  getTitle (title1: string, title2: string): string {
    return (title1) ? title1 : title2;
  }

  getTooltip (name: string): string {
    const def = this.attrDefinitions.find(def => def.Term === name);
    if(def){
      return def.TermDefinition;
    }
    return '';
  }

}
