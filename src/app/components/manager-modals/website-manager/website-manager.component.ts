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
    selector: 'website-manager',
    templateUrl: './website-manager.component.html',
    styleUrls: ['./website-manager.component.css'],
    standalone: false
})
export class WebsiteManagerComponent implements OnInit {

  websiteForm: FormGroup = new FormGroup({
    relatedSystems: new FormControl()
  });

  website = <any>{};

  systemPool: any[] = [];
  systemRelations: any[] = [];
  notSelectedSystems: any[] = [];
  selectedSysIDs: Set<any> = new Set();

  websiteCertify: boolean = false;

  constructor(
    private apiService: ApiService,
    private globals: Globals,
    public modalService: ModalsService,
    private sharedService: SharedService,
    private tableService: TableService) { }

  ngOnInit(): void {
    // Emit setFormDefaults for when edit button is pressed
    if (this.sharedService.websiteFormSub == undefined) {
      this.sharedService.websiteFormSub = this.sharedService.websiteFormEmitter.subscribe(() => { this.setFormDefaults(); });
    }

    this.modalService.currentWebsite.subscribe(website => this.website = website);

    // If the manager modal is exited, clear the certify flag
    $('#websiteManager').on('hidden.bs.modal', function (e) {
      this.websiteCertify = false;
      $("#websiteMngrTabs li:first-child a").tab('show');
    }.bind(this));
  }

  setFormDefaults(): void {
    // Populate Related Systems
    this.apiService.getWebsiteSys(this.website.Website_ID).subscribe((data: any[]) => {
      this.systemRelations = [];
      // Only take ID and name
      data.forEach(element => {
        this.systemRelations.push({
          ID: element.Website_ID,
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
        // to include only systems that are not related to this website
        this.selectedSysIDs = new Set(this.systemRelations.map(({ ID }) => ID));
        this.notSelectedSystems = this.systemPool.filter(({ ID }) => !this.selectedSysIDs.has(ID));

        // Set default values for form with current values after resolving related systems
        this.websiteForm.patchValue({
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
    this.websiteForm.patchValue({
      relatedSystems: this.selectedSysIDs,
    });
  };

  submitForm() {
    // console.log("Form: ", this.websiteForm);  // Debug

    if (this.websiteForm.valid) {
      // Change de/selected IDs to array from set
      if (this.websiteForm.value.relatedSystems) {
        this.websiteForm.value.relatedSystems = Array.from(this.websiteForm.value.relatedSystems);
      };

      // console.log("Form values before committing to database: ", this.websiteForm.value); // Debug

      // Send data to database
      this.apiService.updateWebsiteSys(this.website.Website_ID, this.websiteForm.value).toPromise()
        .then(res => {
          // Grab new data from database
          this.apiService.getOneWebsite(this.website.Website_ID).toPromise()
            .then(data => { this.websiteDetailRefresh(data[0]) }),
            (error) => {
              console.log("GET Updated Website rejected with " + JSON.stringify(error));
            };
        });
    }

  };

  websiteDetailRefresh(data: any) {
    // Refresh Table
    $('#websitesTable').bootstrapTable('refresh');

    // Close Manager Modal and go back to showing Detail Modal
    $('#websiteManager').modal('hide');
    this.tableService.websitesTableClick(data, false);
    $('#websiteDetail').modal('show');
  };

}
