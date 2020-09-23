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
    sysStatus: new FormControl(null, [Validators.required]),
    sysName: new FormControl(null, [Validators.required]),
    sysDesc: new FormControl(),
    sysSSO: new FormControl(null, [Validators.required]),
    sysLink: new FormControl(),
    sysChildApps: new FormControl(),
    deselectedApps: new FormControl()
  });

  system = <any>{};
  createBool: any;
  SSOs: any[] = [];

  appPool: any[] = [];
  childApps: any[] = [];
  notSelected: any[] = [];
  selectedIDs: Set<any> = new Set();
  deSelectedIDs: Set<any> = new Set();

  parentCertify: boolean = false;

  constructor(
    private apiService: ApiService,
    private globals: Globals,
    private modalService: ModalsService,
    private sharedService: SharedService,
    private tableService: TableService) { }

  ngOnInit(): void {
    // Emit setFormDefaults for when edit button is pressed
    if (this.sharedService.systemFormSub == undefined) {
      this.sharedService.systemFormSub = this.sharedService.systemFormEmitter.subscribe(() => { this.setFormDefaults(); });
    }

    this.modalService.currentSys.subscribe(system => this.system = system);
    this.modalService.currentCreate.subscribe(createBool => this.createBool = createBool);

    // Populate SSOs
    this.apiService.getOrganizations().subscribe((data: any[]) => {
      data.forEach(element => {
        if (element.Parent === 'Office of the Administrator (A)') this.SSOs.push(element);
      });
    });

    // If the manager modal is exited, clear the create flag
    $('#systemManager').on('hidden.bs.modal', function (e) {
      this.modalService.updateRecordCreation(false);
      this.parentCertify = false;
      $("#systemMngrTabs li:first-child a").tab('show');
    }.bind(this));
  }

  setFormDefaults(): void {
    if (this.createBool) {
      this.systemForm.reset();  // Clear any erroneous values if any
      this.systemForm.patchValue({
        sysStatus: 'Active'
      });

      // Populate All Apps Pool
      this.childApps = [];
      this.apiService.getApplications().toPromise()
        .then((data: any[]) => {
          this.appPool = [];
          // Only take ID and name
          data.forEach(element => {
            this.appPool.push({
              ID: element.ID,
              Name: element.Name,
              ParentSystemID: element.ParentSystemID
            })
          });
          this.selectedIDs = new Set();
          this.notSelected = this.appPool;
        });
    } else {
      // Adjust Status for rendering
      if (this.system.Status === 'Active') var status = true;
      else var status = false;

      // Populate Child Apps
      this.apiService.getChildApps(this.system.ID).subscribe((data: any[]) => {
        this.childApps = [];
        // Only take ID and name
        data.forEach(element => {
          this.childApps.push({
            ID: element.ID,
            Name: element.Name
          })
        });
      });

      // Populate All Apps Pool minus related apps
      this.apiService.getApplications().toPromise()
        .then((data: any[]) => {
          this.appPool = [];
          // Only take ID and name
          data.forEach(element => {
            this.appPool.push({
              ID: element.ID,
              Name: element.Name,
              ParentSystemID: element.ParentSystemID
            })
          });

          // Take related apps IDs and remove them from the appPool list
          // to include only apps that don't have parent systems yet
          this.selectedIDs = new Set(this.childApps.map(({ ID }) => ID));
          this.notSelected = this.appPool.filter(({ ID }) => !this.selectedIDs.has(ID))
            .filter(({ ParentSystemID }) => !ParentSystemID);

          // Set default values for form with current values after resolving related apps
          this.systemForm.patchValue({
            sysStatus: status,
            sysName: this.system.Name,
            sysDesc: this.system.Description,
            sysSSO: this.sharedService.findInArray(this.SSOs, 'Name', this.system.SSO, 'ID'),
            sysLink: this.system.URL,
            sysChildApps: this.selectedIDs
          });
        }),
        (error) => {
          console.log("Getting applications rejected with " + JSON.stringify(error));
        };
    }
  };

  poolToSelected() {
    // Add to selected list
    let poolVals = $('#sysChildAppsPool').val().map(x => +x)
    poolVals.forEach(val => {
      this.deSelectedIDs.delete(val);
      this.selectedIDs.add(val);
    });
    this.updateSelectLists();
  };

  selectedToPool() {
    // Delete from selected list
    let selectedVals = $('#sysChildAppsSelect').val().map(x => +x)
    selectedVals.forEach(val => {
      this.deSelectedIDs.add(val);
      this.selectedIDs.delete(val);
    });
    this.updateSelectLists();
  };

  updateSelectLists() {
    // Update app pool and child apps lists of options
    this.notSelected = this.appPool.filter(({ ID }) => !this.selectedIDs.has(ID));
    this.childApps = this.appPool.filter(({ ID }) => this.selectedIDs.has(ID));

    // Update form value with selected IDs
    this.systemForm.patchValue({
      sysChildApps: this.selectedIDs,
      deselectedApps: this.deSelectedIDs
    });
  };

  submitForm() {
    console.log("Form: ", this.systemForm);  // Debug

    if (this.systemForm.valid) {
      // Adjust Status for saving
      if (this.systemForm.value.sysStatus) this.systemForm.value.sysStatus = 'Active';
      else this.systemForm.value.sysStatus = 'Retired';

      // Add username to payload
      this.systemForm.value.auditUser = this.globals.authUser;

      // Change de/selected IDs to array from set
      if (this.systemForm.value.sysChildApps) {
        this.systemForm.value.sysChildApps = Array.from(this.systemForm.value.sysChildApps);
      };
      if (this.systemForm.value.deselectedApps) {
        this.systemForm.value.deselectedApps = Array.from(this.systemForm.value.deselectedApps);
      };

      console.log("Form values before committing to database: ", this.systemForm.value); // Debug

      // Send data to database
      if (this.createBool) {
        this.apiService.createParentSys(this.systemForm.value).toPromise()
          .then(res => {
            // Grab new data from database
            this.apiService.getLatestSys().toPromise()
              .then((data: any) => {
                // Update with related apps after getting new ID
                this.apiService.updateParentSys(data[0].ID, this.systemForm.value).toPromise()
                  .then(res => {
                    this.systemDetailRefresh(data[0]);
                  }),
                  (error) => {
                    console.log("Update after creating parent system rejected with " + JSON.stringify(error));
                  };
              }),
              (error) => {
                console.log("Getting latest parent system rejected with " + JSON.stringify(error));
              };
          });
      } else {
        this.apiService.updateParentSys(this.system.ID, this.systemForm.value).toPromise()
          .then(res => {
            // Grab new data from database
            this.apiService.getOneSys(this.system.ID).toPromise()
              .then(data => { this.systemDetailRefresh(data[0]) }),
              (error) => {
                console.log("GET Updated Parent System rejected with " + JSON.stringify(error));
              };
          });
      }

      this.modalService.updateRecordCreation(false);  // Reset Creation flag
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
