import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { Globals } from '../../../common/globals';

import { ApiService } from '../../../services/apis/api.service';
import { ModalsService } from '../../../services/modals/modals.service';
import { SharedService } from "../../../services/shared/shared.service";
import { TableService } from "../../../services/tables/table.service";

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'investment-manager',
  templateUrl: './investment-manager.component.html',
  styleUrls: ['./investment-manager.component.css']
})
export class InvestmentManagerComponent implements OnInit {

  investForm: FormGroup = new FormGroup({
    investStatus: new FormControl(null, [Validators.required]),
    investName: new FormControl(null, [Validators.required]),
    investDesc: new FormControl(null, [Validators.required]),
    invManager: new FormControl(null, [Validators.required]),
    investType: new FormControl(null, [Validators.required]),
    investBY: new FormControl(null, [Validators.required]),
    investUII: new FormControl(null, [Validators.required]),
    investSSO: new FormControl(null, [Validators.required]),
    investPSA: new FormControl(),
    investSSA: new FormControl(),
    // investSSA2: new FormControl(),
    // investSSA3: new FormControl(),
    // investSSA4: new FormControl(),
    investComments: new FormControl(),
    investRelatedApps: new FormControl(),
    deselectedApps: new FormControl()
  });

  budgetYears: string[] = ['BY18', 'BY19', 'BY20', 'BY21', 'BY22']
  createBool: any;
  investment = <any>{};
  managers: any[] = [];
  appPool: any[] = [];
  relatedApps: any[] = [];
  notSelected: any[] = [];
  selectedIDs: Set<any> = new Set();
  deSelectedIDs: Set<any> = new Set();
  serviceAreas: any[] = [{ Name: 'None', ID: null }];
  SSOs: any[] = [];
  types: any[] = [];

  constructor(
    private apiService: ApiService,
    private globals: Globals,
    private modalService: ModalsService,
    private sharedService: SharedService,
    private tableService: TableService) { }

  ngOnInit(): void {
    // Emit setFormDefaults for when edit button is pressed
    if (this.sharedService.investFormSub == undefined) {
      this.sharedService.investFormSub = this.sharedService.investFormEmitter.subscribe(() => { this.setFormDefaults(); });
    }

    this.modalService.currentInvest.subscribe(investment => this.investment = investment);
    this.modalService.currentCreate.subscribe(createBool => this.createBool = createBool);

    // Populate Managers Options
    this.apiService.getPOCs().subscribe((data: any[]) => {
      this.managers = data;
    });

    // Populate Service Areas
    this.apiService.getCapabilities().subscribe((data: any[]) => {
      this.serviceAreas = this.serviceAreas.concat(data);
    })

    // Populate SSOs
    this.apiService.getOrganizations().subscribe((data: any[]) => {
      data.forEach(element => {
        if (element.Parent === 'Office of the Administrator (A)') this.SSOs.push(element);
      });
    });

    // Populate Types
    this.apiService.getInvestTypes().subscribe((data: any[]) => {
      this.types = data;
    });

    // If the manager modal is exited, clear the create flag
    $('#investManager').on('hide.bs.modal', function (e) {
      this.modalService.updateRecordCreation(false);
    }.bind(this));
  }

  setFormDefaults(): void {
    // Only set status default for creating new record
    if (this.createBool) {
      this.investForm.patchValue({
        investStatus: true
      });

      // Populate All Apps Pool
      this.relatedApps = [];
      this.apiService.getApplications().toPromise()
        .then((data: any[]) => {
          this.appPool = [];
          // Only take ID and name
          data.forEach(element => {
            // Include only apps that don't have investments yet
            this.appPool.push({
              ID: element.ID,
              Name: element.Name,
              InvestmentID: element.InvestmentID
            })
          });
          this.selectedIDs = new Set();
          this.notSelected = this.appPool;
        });
    } else {
      // Adjust Status for rendering
      if (this.investment.Active === 1) var status = true;
      else var status = false;

      // Populate Related Apps
      this.apiService.getInvestApps(this.investment.ID).subscribe((data: any[]) => {
        this.relatedApps = [];
        // Only take ID and name
        data.forEach(element => {
          this.relatedApps.push({
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
              InvestmentID: element.InvestmentID
            })
          });

          // Take related apps IDs and remove them from the appPool list
          // to include only apps that don't have investments yet
          this.selectedIDs = new Set(this.relatedApps.map(({ ID }) => ID));
          this.notSelected = this.appPool.filter(({ ID }) => !this.selectedIDs.has(ID))
            .filter(({ InvestmentID }) => !InvestmentID);

          // Set default values for form with current values after resolving related apps
          this.investForm.patchValue({
            investStatus: status,
            investName: this.investment.Name,
            investDesc: this.investment.Description,
            invManager: this.findInArrayID(this.managers, 'Name', this.investment.InvManager),
            investType: this.findInArrayID(this.types, 'Name', this.investment.Type),
            investBY: this.investment.Budget_Year,
            investUII: this.investment.UII,
            investSSO: this.findInArrayID(this.SSOs, 'Name', this.investment.SSO),
            investPSA: this.findInArrayID(this.serviceAreas, 'Name', this.investment.PSA),
            investSSA: this.findInArrayID(this.serviceAreas, 'Name', this.investment.SSA),
            // investSSA2: this.findInArrayID(this.serviceAreas, 'Name', this.investment.sec_service_area2),
            // investSSA3: this.findInArrayID(this.serviceAreas, 'Name', this.investment.sec_service_area3),
            // investSSA4: this.findInArrayID(this.serviceAreas, 'Name', this.investment.sec_service_area4),
            investComments: this.investment.Comments,
            investRelatedApps: this.selectedIDs
          });
        }),
        (error) => {
          console.log("Getting applications rejected with " + JSON.stringify(error));
        };
    }
  };

  findInArrayID(array: any[], arrayKey: string, searchItem: any) {
    var result: any = array.find(element => element[arrayKey] === searchItem);

    if (result) return result.ID;
    else return null
  };

  poolToSelected() {
    // Add to selected list
    let poolVals = $('#investRelAppsPool').val().map(x => +x)
    poolVals.forEach(val => {
      this.deSelectedIDs.delete(val);
      this.selectedIDs.add(val);
    });
    this.updateSelectLists();
  };

  selectedToPool() {
    // Delete from selected list
    let selectedVals = $('#investRelAppsSelect').val().map(x => +x)
    selectedVals.forEach(val => {
      this.deSelectedIDs.add(val);
      this.selectedIDs.delete(val);
    });
    this.updateSelectLists();
  };

  updateSelectLists() {
    // Update app pool and related apps lists of options
    this.notSelected = this.appPool.filter(({ ID }) => !this.selectedIDs.has(ID));
    this.relatedApps = this.appPool.filter(({ ID }) => this.selectedIDs.has(ID));

    // Update form value with selected IDs
    this.investForm.patchValue({
      investRelatedApps: this.selectedIDs,
      deselectedApps: this.deSelectedIDs
    });
  };

  submitForm() {
    // console.log("Form: ", this.investForm);  // Debug

    if (this.investForm.valid) {
      // Adjust Status for saving
      if (this.investForm.value.investStatus) this.investForm.value.investStatus = 1;
      else this.investForm.value.investStatus = 2;

      // Adjust Comments
      if (!this.investForm.value.investComments) this.investForm.value.investComments = 'N/A';

      // Add username to payload
      this.investForm.value.auditUser = this.globals.authUser;

      // Change de/selected IDs to array from set
      this.investForm.value.investRelatedApps = Array.from(this.investForm.value.investRelatedApps);
      this.investForm.value.deselectedApps = Array.from(this.investForm.value.deselectedApps);

      // console.log("Form values before committing to database: ", this.investForm.value); // Debug

      // Send data to database
      if (this.createBool) {
        this.apiService.createInvestment(this.investForm.value).toPromise()
          .then(res => {
            // Grab new data from database
            this.apiService.getLatestInvest().toPromise()
              .then((data: any) => {
                // Update with related apps after getting new ID
                this.apiService.updateInvestment(data[0].ID, this.investForm.value).toPromise()
                  .then(res => {
                    this.investDetailRefresh(data[0]);
                  }),
                  (error) => {
                    console.log("Update after creating investment rejected with " + JSON.stringify(error));
                  };
              }),
              (error) => {
                console.log("Getting latest investment rejected with " + JSON.stringify(error));
              };
          });
      } else {
        this.apiService.updateInvestment(this.investment.ID, this.investForm.value).toPromise()
          .then(res => {
            // Grab new data from database
            this.apiService.getOneInvest(this.investment.ID).toPromise()
              .then(data => { this.investDetailRefresh(data[0]) }),
              (error) => {
                console.log("GET Updated investment rejected with " + JSON.stringify(error));
              };
          });
      }

      this.modalService.updateRecordCreation(false);  // Reset Creation flag
    }
  };

  investDetailRefresh(data: any) {
    // Refresh Table
    $('#investTable').bootstrapTable('refresh');

    // Close Manager Modal and go back to showing Detail Modal
    $('#investManager').modal('hide');
    this.tableService.investTableClick(data);
    $('#investDetail').modal('show');
  };

}
