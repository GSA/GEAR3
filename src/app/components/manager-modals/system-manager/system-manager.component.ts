import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { Globals } from '@common/globals';

import { ApiService } from '@services/apis/api.service';
import { ModalsService } from '@services/modals/modals.service';
import { SharedService } from "@services/shared/shared.service";
import { TableService } from "@services/tables/table.service";

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'system-manager',
  templateUrl: './system-manager.component.html',
  styleUrls: ['./system-manager.component.css']
})
export class SystemManagerComponent implements OnInit {

  systemForm: FormGroup = new FormGroup({
    relatedCaps: new FormControl(),
    deselectedCaps: new FormControl()
  });

  system = <any>{};

  busCapPool: any[] = [];
  capRelations: any[] = [];
  notSelectedCaps: any[] = [];
  selectedCapsIDs: Set<any> = new Set();
  deSelectedCapsIDs: Set<any> = new Set();

  systemCertify: boolean = false;

  constructor(
    private apiService: ApiService,
    private globals: Globals,
    public modalService: ModalsService,
    private sharedService: SharedService,
    private tableService: TableService) { }

  ngOnInit(): void {
    // Emit setFormDefaults for when edit button is pressed
    if (this.sharedService.systemFormSub == undefined) {
      this.sharedService.systemFormSub = this.sharedService.systemFormEmitter.subscribe(() => { this.setFormDefaults(); });
    }

    this.modalService.currentSys.subscribe(system => this.system = system);

    // If the manager modal is exited, clear the certify flag
    $('#systemManager').on('hidden.bs.modal', function (e) {
      this.systemCertify = false;
      $("#systemMngrTabs li:first-child a").tab('show');
    }.bind(this));
  }

  setFormDefaults(): void {
    // Populate Related Capabilities
    this.apiService.getSysCapabilities(this.system.ID).subscribe((data: any[]) => {
      this.capRelations = [];
      // Only take ID and name
      data.forEach(element => {
        this.capRelations.push({
          ID: element.ID,
          Name: element.Name
        })
      });
    });
  
    // Populate Business Capabilities Pool minus related apps
    this.apiService.getCapabilities().toPromise()
      .then((data: any[]) => {
        this.busCapPool = [];
        // Only take ID and name
        data.forEach(element => {
          this.busCapPool.push({
            ID: element.ID,
            Name: element.Name,
          })
        });
        this.selectedCapsIDs = new Set();
        this.notSelectedCaps = this.busCapPool;

        // Take related caps IDs and remove them from the busCapPool list
        // to include only capabilities that are not related to this system
        this.selectedCapsIDs = new Set(this.capRelations.map(({ ID }) => ID));
        this.notSelectedCaps = this.busCapPool.filter(({ ID }) => !this.selectedCapsIDs.has(ID));

        // Set default values for form with current values after resolving related caps
        this.systemForm.patchValue({
          relatedCaps: this.selectedCapsIDs
        });

        // Populate Child Apps
        // this.apiService.getChildApps(this.system.ID).subscribe((data: any[]) => {
        //   this.caps = [];
        //   // Only take ID and name
        //   data.forEach(element => {
        //     this.childApps.push({
        //       ID: element.ID,
        //       Name: element.Name
        //     })
        //   });
    });
  };

  capPoolToSelected() {
    // Add to selected list
    let poolVals = $('#busCapPool').val().map(x => +x)
    poolVals.forEach(val => {
      this.deSelectedCapsIDs.delete(val);
      this.selectedCapsIDs.add(val);
    });
    this.updateSelectLists();
  };

  selectedToCapPool() {
    // Delete from selected list
    let selectedVals = $('#busCapSelect').val().map(x => +x)
    selectedVals.forEach(val => {
      this.deSelectedCapsIDs.add(val);
      this.selectedCapsIDs.delete(val);
    });
    this.updateSelectLists();
  };

  updateSelectLists() {
    // Update all pools and selected lists
    this.notSelectedCaps = this.busCapPool.filter(({ ID }) => !this.selectedCapsIDs.has(ID));
    this.capRelations = this.busCapPool.filter(({ ID }) => this.selectedCapsIDs.has(ID));

    // Update form value with selected IDs
    this.systemForm.patchValue({
      relatedCaps: this.selectedCapsIDs,
      deselectedCaps: this.deSelectedCapsIDs
    });
  };

  submitForm() {
    // console.log("Form: ", this.systemForm);  // Debug

    if (this.systemForm.valid) {
      // Change de/selected IDs to array from set
      if (this.systemForm.value.relatedCaps) {
        this.systemForm.value.relatedCaps = Array.from(this.systemForm.value.relatedCaps);
      };
      if (this.systemForm.value.deselectedCaps) {
        this.systemForm.value.deselectedCaps = Array.from(this.systemForm.value.deselectedCaps);
      };

      // console.log("Form values before committing to database: ", this.systemForm.value); // Debug

      // Send data to database
      this.apiService.updateSystemCaps(this.system.ID, this.systemForm.value).toPromise()
        .then(res => {
          // Grab new data from database
          this.apiService.getOneSys(this.system.ID).toPromise()
            .then(data => { this.systemDetailRefresh(data[0]) }),
            (error) => {
              console.log("GET Updated Parent System rejected with " + JSON.stringify(error));
            };
        });
    }

  };

  systemDetailRefresh(data: any) {
    // Refresh Table
    $('#systemTable').bootstrapTable('refresh');

    // Close Manager Modal and go back to showing Detail Modal
    $('#systemManager').modal('hide');
    this.tableService.systemsTableClick(data);
    $('#systemDetail').modal('show');
  };

}