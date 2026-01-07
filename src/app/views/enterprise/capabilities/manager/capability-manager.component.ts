import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Capability } from '@api/models/capabilities.model';

import { Globals } from '@common/globals';

import { ApiService } from '@services/apis/api.service';
import { ModalsService } from '@services/modals/modals.service';
import { SharedService } from "@services/shared/shared.service";
import { TableService } from "@services/tables/table.service";

// Declare jQuery symbol
declare var $: any;

@Component({
    selector: 'capability-manager',
    templateUrl: './capability-manager.component.html',
    styleUrls: ['./capability-manager.component.scss'],
    standalone: false
})
export class CapabilityManagerComponent implements OnInit {

  public capabilityId: number = null;
  public detailsData: Capability = null;
  public isDataReady: boolean = false;

  capabilityForm: FormGroup = new FormGroup({
    relatedOrgs: new FormControl()
  });

  // capability = <any>{};

  orgPool: any[] = [];
  orgRelations: any[] = [];
  notSelectedOrgs: any[] = [];
  selectedOrgsIDs: Set<any> = new Set();

  capabilityCertify: boolean = false;

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
      this.capabilityId = +params.get('capId');

      this.apiService.getOneCap(this.capabilityId).subscribe(cap => {
        this.detailsData = cap;
        this.setFormDefaults();
      });
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
    // Populate Related Orgs
    this.apiService.getCapOrgs(this.capabilityId).subscribe((data: any[]) => {
      this.orgRelations = [];
      // Only take ID and name
      data.forEach(element => {
        this.orgRelations.push({
          ID: element.ID,
          Name: element.Name,
          Symbol: element.OrgSymbol
        })
      });
    });

    // Populate Orgs Pool minus related ones
    this.apiService.getOrganizations().toPromise()
      .then((data: any[]) => {
        this.orgPool = [];
        // Only take ID and name
        data.forEach(element => {
          this.orgPool.push({
            ID: element.ID,
            Name: element.Name,
            Symbol: element.OrgSymbol
          })
        });
        this.selectedOrgsIDs = new Set();
        this.notSelectedOrgs = this.orgPool;

        // Take related org IDs and remove them from the orgPool list
        // to include only Orgs that are not related to this capability
        this.selectedOrgsIDs = new Set(this.orgRelations.map(({ ID }) => ID));
        this.notSelectedOrgs = this.orgPool.filter(({ ID }) => !this.selectedOrgsIDs.has(ID));

        // Set default values for form with current values after resolving related orgs
        this.capabilityForm.patchValue({
          relatedOrgs: this.selectedOrgsIDs
        });
        this.isDataReady = true;
    });
  
  };

  poolSelectedMove(elementID, selectedIDs, movement) {
    if (movement === 'select') {
      // Add to selected list
      let vals = $(elementID).val().map(x => x)
      vals.forEach(val => {
        selectedIDs.add(val);
      });
    } else if (movement === 'deselect') {
      let vals = $(elementID).val().map(x => x)
      vals.forEach(val => {
        selectedIDs.delete(val);
      });
    }
    this.updateSelectLists();
  };

  updateSelectLists() {
    // Update all pools and selected lists
    this.notSelectedOrgs = this.orgPool.filter(({ ID }) => !this.selectedOrgsIDs.has(ID));
    this.orgRelations = this.orgPool.filter(({ ID }) => this.selectedOrgsIDs.has(ID));

    // Update form value with selected IDs
    this.capabilityForm.patchValue({
      relatedOrgs: this.selectedOrgsIDs,
    });
  };

  submitForm() {
    // console.log("Form: ", this.capabilityForm);  // Debug

    if (this.capabilityForm.valid) {
      // Change de/selected IDs to array from set
      if (this.capabilityForm.value.relatedOrgs) {
        this.capabilityForm.value.relatedOrgs = Array.from(this.capabilityForm.value.relatedOrgs);
      };

      // console.log("Form values before committing to database: ", this.capabilityForm.value); // Debug

      // Send data to database
      this.apiService.updateCapOrgs(this.capabilityId, this.capabilityForm.value).toPromise()
        .then(res => {
          // Grab new data from database
          this.apiService.getOneCap(this.capabilityId).toPromise()
            .then(data => { /* this.capabilityDetailRefresh(data[0]) */ }),
            (error) => {
              console.log("GET Updated System rejected with " + JSON.stringify(error));
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
