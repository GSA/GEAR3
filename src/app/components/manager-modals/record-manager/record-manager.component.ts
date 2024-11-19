import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { Globals } from '@common/globals';

import { ApiService } from '@services/apis/api.service';
import { ModalsService } from '@services/modals/modals.service';
import { SharedService } from "@services/shared/shared.service";
import { TableService } from "@services/tables/table.service";

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'record-manager',
  templateUrl: './record-manager.component.html',
  styleUrls: ['./record-manager.component.css']
})
export class RecordManagerComponent implements OnInit {
  isBrowser: boolean;

  recordForm: FormGroup = new FormGroup({
    relatedSystems: new FormControl()
  });

  record = <any>{};

  systemPool: any[] = [];
  systemRelations: any[] = [];
  notSelectedSystems: any[] = [];
  selectedSysIDs: Set<any> = new Set();

  recordCertify: boolean = false;

  constructor(
    private apiService: ApiService,
    private globals: Globals,
    public modalService: ModalsService,
    private sharedService: SharedService,
    private tableService: TableService, @Inject(PLATFORM_ID) private platformId: any) { 
      this.isBrowser = isPlatformBrowser(this.platformId);
    }

  ngOnInit(): void {
    // Emit setFormDefaults for when edit button is pressed
    if (this.sharedService.recordFormSub == undefined) {
      this.sharedService.recordFormSub = this.sharedService.recordFormEmitter.subscribe(() => { this.setFormDefaults(); });
    }

    this.modalService.currentRecord.subscribe(record => this.record = record);

    if (!this.isBrowser) {
      return;
    }
    // If the manager modal is exited, clear the certify flag
    $('#recordManager').on('hidden.bs.modal', function (e) {
      this.recordCertify = false;
      $("#recordMngrTabs li:first-child a").tab('show');
    }.bind(this));
  }

  setFormDefaults(): void {
    // Populate Related Systems
    this.apiService.getRecordSys(this.record.Rec_ID).subscribe((data: any[]) => {
      this.systemRelations = [];
      // Only take ID and name
      data.forEach(element => {
        this.systemRelations.push({
          ID: element.Rec_ID,
          Name: element.Name,
          DisplayName: element.DisplayName
        })
      });
    });

    // Populate Systems Pool minus related ones
    this.apiService.getSystems().toPromise()
      .then((data: any[]) => {
        this.systemPool = [];
        // Only take ID and name of active systems
        data.forEach(element => {
          if (element.Status === 'Active') {
            this.systemPool.push({
              ID: element.ID,
              Name: element.Name,
              DisplayName: element.DisplayName
            })
          };
        });
        this.selectedSysIDs = new Set();
        this.notSelectedSystems = this.systemPool;

        // Take related system IDs and remove them from the systemPool list
        // to include only systems that are not related to this record
        this.selectedSysIDs = new Set(this.systemRelations.map(({ ID }) => ID));
        this.notSelectedSystems = this.systemPool.filter(({ ID }) => !this.selectedSysIDs.has(ID));

        // Set default values for form with current values after resolving related systems
        this.recordForm.patchValue({
          relatedSystems: this.selectedSysIDs
        });
    });
  
  };

  poolSelectedMove(elementID, selectedIDs, movement) {
    if (movement === 'select') {
      // Add to selected list
      let vals = $(elementID).val().map(x => +x)
      vals.forEach(val => {
        selectedIDs.add(val);
      });
    } else if (movement === 'deselect') {
      let vals = $(elementID).val().map(x => +x)
      vals.forEach(val => {
        selectedIDs.delete(val);
      });
    }
    this.updateSelectLists();
  };

  updateSelectLists() {
    // Update all pools and selected lists
    this.notSelectedSystems = this.systemPool.filter(({ ID }) => !this.selectedSysIDs.has(ID));
    this.systemRelations = this.systemPool.filter(({ ID }) => this.selectedSysIDs.has(ID));

    // Update form value with selected IDs
    this.recordForm.patchValue({
      relatedSystems: this.selectedSysIDs,
    });
  };

  submitForm() {
    // console.log("Form: ", this.recordForm);  // Debug

    if (this.recordForm.valid) {
      // Change de/selected IDs to array from set
      if (this.recordForm.value.relatedSystems) {
        this.recordForm.value.relatedSystems = Array.from(this.recordForm.value.relatedSystems);
      };

      // console.log("Form values before committing to database: ", this.recordForm.value); // Debug

      // Send data to database
      this.apiService.updateRecordSys(this.record.Rec_ID, this.recordForm.value).toPromise()
        .then(res => {
          // Grab new data from database
          this.apiService.getOneRecord(this.record.Rec_ID).toPromise()
            .then(data => { this.recordDetailRefresh(data[0]) }),
            (error) => {
              console.log("GET Updated Record rejected with " + JSON.stringify(error));
            };
        });
    }

  };

  recordDetailRefresh(data: any) {
    // Refresh Table
    $('#recordsTable').bootstrapTable('refresh');

    // Close Manager Modal and go back to showing Detail Modal
    $('#recordManager').modal('hide');
    this.tableService.recordsTableClick(data, false);
    $('#recordDetail').modal('show');
  };

}
