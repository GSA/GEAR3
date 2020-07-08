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
    investName: new FormControl(null, [Validators.required]),
    investDesc: new FormControl(null, [Validators.required]),
    invManager: new FormControl(null, [Validators.required]),
    investType: new FormControl(null, [Validators.required]),
    investUII: new FormControl(null, [Validators.required]),
    investSSO: new FormControl(null, [Validators.required]),
    investPSA: new FormControl(),
    investSSA: new FormControl(),
    // investSSA2: new FormControl(),
    // investSSA3: new FormControl(),
    // investSSA4: new FormControl(),
    investComments: new FormControl()
  });

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
    // Set default values for form with current values
    this.investForm.patchValue({
      investName: this.investment.Name,
      investDesc: this.investment.Description,
      invManager: this.managers.find(element => element.Name === this.investment.InvManager).ID,
      investType: this.types.find(element => element.Name === this.investment.Type).ID,
      investUII: this.investment.UII,
      investSSO: this.SSOs.find(element => element.Name === this.investment.SSO).ID,
      investPSA: this.serviceAreas.find(element => element.Name === this.investment.PSA).ID,
      investSSA: this.serviceAreas.find(element => element.Name === this.investment.SSA).ID,
      // investSSA2: this.serviceAreas.find(element => element.Name === this.investment.sec_service_area2).ID,
      // investSSA3: this.serviceAreas.find(element => element.Name === this.investment.sec_service_area3).ID,
      // investSSA4: this.serviceAreas.find(element => element.Name === this.investment.sec_service_area4).ID,
      investComments: this.investment.Comments,
    });
  }

  submitForm() {
    console.log('Form Submitted with values: ', this.investForm.value);  // Debug

    // Send new data to database
    this.apiService.updateInvestment(this.investment.ID, this.investForm.value).toPromise()
      .then(res => {
        // Grab new data from database
        this.apiService.getOneInvest(this.investment.ID)
      })

    // Grab new data from database
    this.apiService.getOneInvest(this.investment.ID).toPromise()
      .then(data => {
        // Close Manager Modal and go back to showing Detail Modal
        $('#investManager').modal('hide');
        this.tableService.investTableClick(data[0]);
        $('#investDetail').modal('show');
      }), (error) => {
        console.log("Promise rejected with " + JSON.stringify(error));
      };
  }

}
