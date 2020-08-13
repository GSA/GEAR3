import { Component, OnInit } from '@angular/core';
import { formatDate } from '@angular/common';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { Globals } from '@common/globals';

import { ApiService } from '@services/apis/api.service';
import { ModalsService } from '@services/modals/modals.service';
import { SharedService } from "@services/shared/shared.service";
import { TableService } from "@services/tables/table.service";

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'it-standard-manager',
  templateUrl: './it-standard-manager.component.html',
  styleUrls: ['./it-standard-manager.component.css']
})
export class ItStandardManagerComponent implements OnInit {

  itStandardsForm: FormGroup = new FormGroup({
    itStandStatus: new FormControl(null, [Validators.required]),
    itStandName: new FormControl(null, [Validators.required]),
    itStandPOC: new FormControl(null, [Validators.required]),
    itStandDesc: new FormControl(),
    itStandType: new FormControl(null, [Validators.required]),
    itStandCategory: new FormControl(null, [Validators.required]),
    itStand508: new FormControl(),
    itStandMyView: new FormControl(),
    itStandVendorOrg: new FormControl(),
    itStandDeployment: new FormControl(null, [Validators.required]),
    itStandGoldImg: new FormControl(),
    itStandGoldComment: new FormControl(),
    itStandAprvExp: new FormControl(),
    itStandComments: new FormControl(),
    itStandRefDocs: new FormControl()
  });

  itStandard = <any>{};
  createBool: any;
  statuses: any[];
  POCs: any[] = [];
  types: any[] = [];
  categories: any[] = [];
  compliance: any[] = [];
  deploymentTypes: any[] = [];
  aprvExpDate: Date;

  constructor(
    private apiService: ApiService,
    private globals: Globals,
    public modalService: ModalsService,
    private sharedService: SharedService,
    private tableService: TableService) { }

  ngOnInit(): void {
    // Emit setFormDefaults for when edit button is pressed
    if (this.sharedService.itStandardsFormSub == undefined) {
      this.sharedService.itStandardsFormSub = this.sharedService.itStandardsFormEmitter.subscribe(() => { this.setFormDefaults(); });
    }

    this.modalService.currentITStand.subscribe(itStandard => this.itStandard = itStandard);
    this.modalService.currentCreate.subscribe(createBool => this.createBool = createBool);

    // Populate Statuses
    this.apiService.getITStandStatuses().subscribe((data: any[]) => { this.statuses = data });

    // Populate POC Options
    this.apiService.getPOCs().subscribe((data: any[]) => { this.POCs = data });

    // Populate Standard Types
    this.apiService.getITStandTypes().subscribe((data: any[]) => { this.types = data });

    // Populate Categories
    this.apiService.getITStandCategories().subscribe((data: any[]) => { this.categories = data });

    // Populate 508 Compliance Statuses
    this.apiService.getITStand508Statuses().subscribe((data: any[]) => { this.compliance = data });

    // Populate Deployment Types
    this.apiService.getITStandDeploymentTypes().subscribe((data: any[]) => { this.deploymentTypes = data });

    // Instantiate the date picker
    $('#itStandAprvExp').datepicker({
      todayBtn: true,
      clearBtn: true,
      daysOfWeekHighlighted: "0,6",
      todayHighlight: true,
      toggleActive: true,
      templates: {
        leftArrow: '<i class="fas fa-long-arrow-alt-left"></i>',
        rightArrow: '<i class="fas fa-long-arrow-alt-right"></i>'
      }
    });

    // If the manager modal is exited, clear the create flag
    $('#itStandardsManager').on('hide.bs.modal', function (e) {
      this.modalService.updateRecordCreation(false);
    }.bind(this));
  }

  setFormDefaults(): void {
    // Only set status default for creating new record
    if (this.createBool) {
      this.itStandardsForm.reset();  // Clear any erroneous values if any
      this.itStandardsForm.patchValue({
        itStandStatus: 2
      });
    } else {
      console.log(this.itStandard);
      // Set Approval Expiration Date on Date Picker
      this.aprvExpDate = new Date(this.itStandard.ApprovalExpirationDate);
      $('#itStandAprvExp').datepicker('setDate', this.aprvExpDate);

      // Parse and find IDs for list of POCs
      var pocIDs = [];
      if (this.itStandard.POC) {
        this.itStandard.POC.split('; ').forEach(poc => {
          // Index 0 has name of POC
          let pocName = poc.split(', ')[0]
          pocIDs.push(this.sharedService.findInArrayID(this.POCs, 'Name', pocName));
        });
      };

      // Adjust MyView for rendering
      if (this.itStandard.Available_through_Myview === 'T') var myView = true;
      else var myView = false;

      if (this.itStandard.Gold_Image === 'T') var goldImg = true;
      else var goldImg = false;

      // Parse and find IDs for list of Categories
      var categoryIDs = [];
      if (this.itStandard.Category) {
        this.itStandard.Category.split(', ').forEach(cat => {
          categoryIDs.push(this.sharedService.findInArrayID(this.categories, 'Name', cat))
        });
      };

      // Set default values for form with current values
      this.itStandardsForm.patchValue({
        itStandStatus: this.sharedService.findInArrayID(this.statuses, 'Name', this.itStandard.Status),
        itStandName: this.itStandard.Name,
        itStandPOC: pocIDs,
        itStandDesc: this.itStandard.Description,
        itStandType: this.sharedService.findInArrayID(this.types, 'Name', this.itStandard.StandardType),
        itStandCategory: categoryIDs,
        itStand508: this.sharedService.findInArrayID(this.compliance, 'Name', this.itStandard.ComplianceStatus),
        itStandMyView: myView,
        itStandVendorOrg: this.itStandard.Vendor_Standard_Organization,
        itStandDeployment: this.sharedService.findInArrayID(this.deploymentTypes, 'Name', this.itStandard.DeploymentType),
        itStandGoldImg: goldImg,
        itStandGoldComment: this.itStandard.Gold_Image_Comment,
        itStandAprvExp: formatDate(this.aprvExpDate, 'yyyy-MM-dd', 'en-US'),
        itStandComments: this.itStandard.Comments,
        itStandRefDocs: this.itStandard.ReferenceDocuments
      });
    }
  };

  submitForm() {
    // console.log("Form: ", this.itStandardsForm);  // Debug

    if (this.itStandardsForm.valid) {
      // Adjust MyView & Gold Image for saving
      if (this.itStandardsForm.value.itStandMyView) this.itStandardsForm.value.itStandMyView = 'T';
      else this.itStandardsForm.value.itStandMyView = 'F';

      if (this.itStandardsForm.value.itStandGoldImg) this.itStandardsForm.value.itStandGoldImg = 'T';
      else this.itStandardsForm.value.itStandGoldImg = 'F';

      // Set Date from Date Picker
      if (this.itStandardsForm.value.itStandAprvExp) {
        this.itStandardsForm.value.itStandAprvExp = formatDate($('#itStandAprvExp').datepicker('getFormattedDate'), 'yyyy-MM-dd', 'en-US');
      }

      // Adjust for N/A text fields
      if (!this.itStandardsForm.value.itStandVendorOrg) this.itStandardsForm.value.itStandVendorOrg = 'N/A';
      if (!this.itStandardsForm.value.itStandGoldComment) this.itStandardsForm.value.itStandGoldComment = 'N/A';
      if (!this.itStandardsForm.value.itStandComments) this.itStandardsForm.value.itStandComments = 'N/A';

      // Add username to payload
      this.itStandardsForm.value.auditUser = this.globals.authUser;

      // console.log("Form values before committing to database: ", this.itStandardsForm.value); // Debug

      // Send data to database
      if (this.createBool) {
        this.apiService.createITStandard(this.itStandardsForm.value).toPromise()
          .then(res => {
            // Grab new data from database for ID
            this.apiService.getLatestITStand().toPromise()
              .then(data => {
                // Update Categories and POCs with new ID
                this.apiService.updateITStandard(data[0].ID, this.itStandardsForm.value).toPromise()
                  .then(res => {
                    // Now get all the complete new data
                    this.apiService.getLatestITStand().toPromise()
                      .then(data => {
                        // Then update the details modal
                        this.itStandDetailRefresh(data[0])
                      })
                  }),
                  (error) => {
                    console.log("Update after creating IT Standard rejected with " + JSON.stringify(error));
                  };
              }),
              (error) => {
                console.log("GET Latest IT Standard rejected with " + JSON.stringify(error));
              };
          });
      } else {
        this.apiService.updateITStandard(this.itStandard.ID, this.itStandardsForm.value).toPromise()
          .then(res => {
            // Grab new data from database
            this.apiService.getOneITStandard(this.itStandard.ID).toPromise()
              .then(data => { this.itStandDetailRefresh(data[0]) }),
              (error) => {
                console.log("GET One IT Standard rejected with " + JSON.stringify(error));
              };
          });
      }

      this.modalService.updateRecordCreation(false);  // Reset Creation flag
    }
  }

  itStandDetailRefresh(data: any) {
    // Refresh Table
    $('#itStandardsTable').bootstrapTable('refresh');

    // Close Manager Modal and go back to showing Detail Modal
    $('#itStandardsManager').modal('hide');
    this.tableService.itStandTableClick(data);
    $('#itStandardDetail').modal('show');
  }

}
