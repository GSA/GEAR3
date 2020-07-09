import { Component, OnInit } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { FormGroup, FormControl, Validators } from '@angular/forms';

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
    investComments: new FormControl()
  });

  budgetYears: string[] = ['BY18', 'BY19', 'BY20', 'BY21', 'BY22']
  investment = <any>{};
  managers: any[] = [];
  serviceAreas: any[] = [{ Name: 'None', ID: null }];
  SSOs: any[] = [];
  types: any[] = [];

  constructor(
    private apiService: ApiService,
    private modalService: ModalsService,
    private sharedService: SharedService,
    private tableService: TableService) { }

  ngOnInit(): void {
    // Emit setFormDefaults for when edit button is pressed
    if (this.sharedService.investFormSub == undefined) {
      this.sharedService.investFormSub = this.sharedService.investFormEmitter.subscribe(() => { this.setFormDefaults(); });
    }

    this.modalService.currentInvest.subscribe(investment => this.investment = investment);

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
  }

  setFormDefaults(): void {
    // Adjust Status for rendering
    if (this.investment.Active === 1) var status = true;
    else var status = false;

    // Set default values for form with current values
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
    });
  }

  findInArrayID(array: any[], arrayKey: string, searchItem: any) {
    var result: any = array.find(element => element[arrayKey] === searchItem);

    if (result) return result.ID;
    else return null
  }

  submitForm() {
    // Adjust Status for saving
    if (this.investForm.value.investStatus) this.investForm.value.investStatus = 1;
    else this.investForm.value.investStatus = 2;

    // console.log("Form values: ", this.investForm.value);  // Debug

    // Send new data to database
    this.apiService.updateInvestment(this.investment.ID, this.investForm.value).toPromise()
      .then(res => {
        // Grab new data from database
        this.apiService.getOneInvest(this.investment.ID).toPromise()
          .then(data => {
            // Refresh Table
            $('#investTable').bootstrapTable('refresh');

            // Close Manager Modal and go back to showing Detail Modal
            $('#investManager').modal('hide');
            this.tableService.investTableClick(data[0]);
            $('#investDetail').modal('show');
          }), (error) => {
            console.log("Promise rejected with " + JSON.stringify(error));
          };
      });
  }

}
