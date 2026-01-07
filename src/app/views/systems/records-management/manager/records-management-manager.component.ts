import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Capability } from '@api/models/capabilities.model';
import { Record } from '@api/models/records.model';

import { Globals } from '@common/globals';

import { ApiService } from '@services/apis/api.service';
import { ModalsService } from '@services/modals/modals.service';
import { SharedService } from "@services/shared/shared.service";
import { TableService } from "@services/tables/table.service";

// Declare jQuery symbol
declare var $: any;

@Component({
    selector: 'records-management-manager',
    templateUrl: './records-management-manager.component.html',
    styleUrls: ['./records-management-manager.component.scss'],
    standalone: false
})
export class RecordsManagementManagerComponent implements OnInit {

  public recordId: number = null;
  public detailsData: Record = null;
  public isDataReady: boolean = false;

  recordForm: FormGroup = new FormGroup({
    relatedSystems: new FormControl()
  });

  // record = <any>{};

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
    private tableService: TableService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.recordId = +params.get('recID');

      this.apiService.getOneRecord(this.recordId).subscribe(rec => {
        this.detailsData = rec;
      });

      this.setFormDefaults();
    });
    // Emit setFormDefaults for when edit button is pressed
    // if (this.sharedService.capabilityFormSub == undefined) {
    //   this.sharedService.capabilityFormSub = this.sharedService.capabilityFormEmitter.subscribe(() => { this.setFormDefaults(); });
    // }

    // this.modalService.currentCap.subscribe(capability => this.capability = capability);

    // // If the manager modal is exited, clear the certify flag
    // $('#capabilityManager').on('hidden.bs.modal', function (e) {
    //   this.capabilityCertify = false;
    //   $("#capabilityMngrTabs li:first-child a").tab('show');
    // }.bind(this));
  }

  setFormDefaults(): void {
    // Populate Related Systems
    this.apiService.getRecordSys(this.recordId).subscribe((data: any[]) => {
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
    this.isDataReady = true;
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
      this.apiService.updateRecordSys(this.detailsData.Rec_ID, this.recordForm.value).toPromise()
        .then(res => {
          // Grab new data from database
          this.apiService.getOneRecord(this.detailsData.Rec_ID).toPromise()
            .then(),
            (error) => {
              console.log("GET Updated Record rejected with " + JSON.stringify(error));
            };
        });
    }

  };

  // capabilityDetailRefresh(data: any) {
  //   // Refresh Table
  //   $('#capTable').bootstrapTable('refresh');

  //   // Close Manager Modal and go back to showing Detail Modal
  //   $('#capabilityManager').modal('hide');
  //   this.tableService.capsTableClick(data, false);
  //   $('#capabilityDetail').modal('show');
  // };

}
