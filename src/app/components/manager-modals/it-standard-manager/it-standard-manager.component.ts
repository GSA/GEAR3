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
    tcManufacturer: new FormControl(null, [Validators.required]),
    tcSoftwareProduct: new FormControl(null, [Validators.required]),
    tcSoftwareVersion: new FormControl(null, [Validators.required]),
    tcSoftwareRelease: new FormControl(),
    itStandStatus: new FormControl(null, [Validators.required]),
    itStandName: new FormControl(),
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

  POCs: any = [];
  pocsLoading = false;
  pocsBuffer = [];
  bufferSize = 50;

  manufacturers: any = [];
  manufacturersLoading = false;
  manufacturersBuffer = [];

  softwareProducts: any = [];
  softwareProductsLoading = false;
  softwareProductsBuffer = [];

  softwareVersions: any = [];
  softwareVersionsLoading = false;
  softwareVersionsBuffer = [];

  softwareReleases: any = [];
  softwareReleasesLoading = false;
  softwareReleasesBuffer = [];
  endOfLifeDate: Date;

  types: any[] = [];

  categories: any = [];
  catsLoading = false;
  catsBuffer = [];

  compliance: any[] = [];
  deploymentTypes: any[] = [];
  aprvExpDate: Date;

  itStandCertify: boolean = false;

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

    // Populate Manufacturer Options
    this.manufacturersLoading = true;
    this.apiService.getManufacturers().subscribe((data: any[]) => {
      this.manufacturers = data;
      this.manufacturersBuffer = this.manufacturers.slice(0, this.bufferSize);
      this.manufacturersLoading = false;
    });

    this.disableSoftwareProduct();
    this.disableSoftwareVersion();
    this.disableSoftwareRelease();

    // disable the old IT Standard Name field
    this.disableOldITStandardName();

    // Populate Statuses
    this.apiService.getITStandStatuses().subscribe((data: any[]) => { this.statuses = data });

    // Populate POC Options
    this.pocsLoading = true;
    this.apiService.getPOCs().subscribe((data: any[]) => {
      this.POCs = data;
      this.pocsBuffer = this.POCs.slice(0, this.bufferSize);
      this.pocsLoading = false;
    });

    // Populate Standard Types
    this.apiService.getITStandTypes().subscribe((data: any[]) => { this.types = data });

    // Populate Categories
    this.catsLoading = true;
    this.apiService.getITStandCategories().subscribe((data: any[]) => {
      this.categories = data;
      this.catsBuffer = this.categories.slice(0, this.bufferSize);
      this.catsLoading = false;
    });

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
    $('#itStandardsManager').on('hidden.bs.modal', function (e) {
      this.modalService.updateRecordCreation(false);
      this.itStandCertify = false;
      $("#itStandMngrTabs li:first-child a").tab('show');
    }.bind(this));
  }

  setFormDefaults(): void {

    // Only set status default for creating new record
    const twoYearsLater = new Date();
    twoYearsLater.setFullYear(twoYearsLater.getFullYear() + 2);
    
    if (this.createBool) {
      this.itStandardsForm.reset();  // Clear any erroneous values if any
      // Set Approval Expiration Date on Date Picker to +2 years from current date
      $('#itStandAprvExp').datepicker('setDate', twoYearsLater);
      this.itStandardsForm.patchValue({
        itStandStatus: 2
      });
    } else {

      // Set Approval Expiration Date on Date Picker
      const datecheck = new Date();
      if (this.itStandard.ApprovalExpirationDate !== null) {
        this.aprvExpDate = new Date(this.itStandard.ApprovalExpirationDate);
        $('#itStandAprvExp').datepicker('setDate', this.aprvExpDate);
      } else {
        $('#itStandAprvExp').datepicker('setDate', twoYearsLater);
      }

      // Parse and find IDs for list of POCs
      var pocIDs = [];
      if (this.itStandard.POC) {
        this.itStandard.POC.split('; ').forEach(poc => {
          // Index 0 has name of POC
          let pocName = poc.split(', ')[0]
          pocIDs.push(this.sharedService.findInArray(this.POCs, 'Name', pocName, 'SamAccountName'));
        });
      };

      // if Manufacturer is not null, set the Software Product options
      if (this.itStandard.Manufacturer) {
        this.manufacturerChange({ id: this.itStandard.Manufacturer, name: this.itStandard.ManufacturerName });
        //this.enableSoftwareProduct();

        if (this.itStandard.SoftwareProduct) {
          this.softwareProductChange({ id: this.itStandard.SoftwareProduct, name: this.itStandard.SoftwareProductName });
          //this.enableSoftwareVersion();

          if (this.itStandard.SoftwareVersion) {
            this.softwareVersionChange({ id: this.itStandard.SoftwareVersion, name: this.itStandard.SoftwareVersionName });
            //this.enableSoftwareRelease();
          } else {
            this.disableSoftwareRelease();
          }
        } else {
          this.disableSoftwareVersion();
          this.disableSoftwareRelease();
        }
      } else {
        this.disableSoftwareProduct();
        this.disableSoftwareVersion();
        this.disableSoftwareRelease();
      }

      


      // Adjust MyView for rendering - could turn this into one line:
      var myView = this.itStandard.Available_through_Myview === 'T' 

      // Adjust Gold Image for rendering
      var goldImg = this.itStandard.Gold_Image === 'T'

      // Parse and find IDs for list of Categories
      var categoryIDs = [];
      if (this.itStandard.Category) {
        this.itStandard.Category.split(', ').forEach(cat => {
          categoryIDs.push(this.sharedService.findInArray(this.categories, 'Name', cat))
        });
      };

      // Set default values for form with current values
      this.itStandardsForm.patchValue({
        tcManufacturer: this.itStandard.Manufacturer,
        tcSoftwareProduct: this.itStandard.SoftwareProduct,
        tcSoftwareVersion: this.itStandard.SoftwareVersion,
        tcSoftwareRelease: this.itStandard.SoftwareRelease,
        itStandStatus: this.sharedService.findInArray(this.statuses, 'Name', this.itStandard.Status),
        itStandName: this.itStandard.Name,
        itStandPOC: pocIDs,
        itStandDesc: this.itStandard.Description,
        itStandType: this.sharedService.findInArray(this.types, 'Name', this.itStandard.StandardType),
        itStandCategory: categoryIDs,
        itStand508: this.sharedService.findInArray(this.compliance, 'Name', this.itStandard.ComplianceStatus),
        itStandMyView: myView,
        itStandVendorOrg: this.itStandard.Vendor_Standard_Organization,
        itStandDeployment: this.sharedService.findInArray(this.deploymentTypes, 'Name', this.itStandard.DeploymentType),
        itStandGoldImg: goldImg,
        itStandGoldComment: this.itStandard.Gold_Image_Comment,
        itStandAprvExp: formatDate(this.aprvExpDate, 'yyyy-MM-dd', 'en-US'),
        itStandComments: this.itStandard.Comments,
        itStandRefDocs: this.itStandard.ReferenceDocuments
      });
    }
  };

  submitForm() {
    //console.log("Form: ", this.itStandardsForm);  // Debug

    if (this.itStandardsForm.valid) {
      // Adjust MyView & Gold Image for saving
      if (this.itStandardsForm.value.itStandMyView) this.itStandardsForm.value.itStandMyView = 'T';
      else this.itStandardsForm.value.itStandMyView = 'F';

      if (this.itStandardsForm.value.itStandGoldImg) this.itStandardsForm.value.itStandGoldImg = 'T';
      else this.itStandardsForm.value.itStandGoldImg = 'F';

      // Set Date from Date Picker
      if ($('#itStandAprvExp').data('datepicker')) {
        this.itStandardsForm.value.itStandAprvExp = $('#itStandAprvExp').data('datepicker').getFormattedDate('yyyy-mm-dd');
      }

      // Adjust for N/A text fields
      if (!this.itStandardsForm.value.itStandVendorOrg) this.itStandardsForm.value.itStandVendorOrg = 'N/A';
      if (!this.itStandardsForm.value.itStandGoldComment) this.itStandardsForm.value.itStandGoldComment = 'N/A';
      if (!this.itStandardsForm.value.itStandComments) this.itStandardsForm.value.itStandComments = 'N/A';
      if (!this.itStandardsForm.value.itStand508) this.itStandardsForm.value.itStand508 = '3';

      // replace ' from all text fields
      if (String(this.itStandardsForm.value.itStandDesc).includes("'")) {
        this.itStandardsForm.value.itStandDesc = this.itStandardsForm.value.itStandDesc.replace(/'/g, "''");
      }
      if (String(this.itStandardsForm.value.itStandVendorOrg).includes("'")) {
        this.itStandardsForm.value.itStandVendorOrg = this.itStandardsForm.value.itStandVendorOrg.replace(/'/g, "''");
      }
      if (String(this.itStandardsForm.value.itStandGoldComment).includes("'")) {
        this.itStandardsForm.value.itStandGoldComment = this.itStandardsForm.value.itStandGoldComment.replace(/'/g, "''");
      }
      if (String(this.itStandardsForm.value.itStandComments).includes("'")) {
        this.itStandardsForm.value.itStandComments = this.itStandardsForm.value.itStandComments.replace(/'/g, "''");
      }
      if (String(this.itStandardsForm.value.itStandRefDocs).includes("'")) {
        this.itStandardsForm.value.itStandRefDocs = this.itStandardsForm.value.itStandRefDocs.replace(/'/g, "''");
      }

      // Add username to payload
      this.itStandardsForm.value.auditUser = this.globals.authUser;

      // add ManufacturerName to payload
      if (this.itStandardsForm.value.tcManufacturer) {
        this.itStandardsForm.value.tcManufacturerName = this.sharedService.findInArray(this.manufacturers, 'id', this.itStandardsForm.value.tcManufacturer, 'name');
        //console.log("ManufacturerName: ", this.itStandardsForm.value.tcManufacturerName);
      }

      // add SoftwareProductName to payload
      if (this.itStandardsForm.value.tcSoftwareProduct) {
        this.itStandardsForm.value.tcSoftwareProductName = this.sharedService.findInArray(this.softwareProducts, 'id', this.itStandardsForm.value.tcSoftwareProduct, 'name');
        //console.log("SoftwareProductName: ", this.itStandardsForm.value.tcSoftwareProductName);
      }

      // add SoftwareVersionName to payload
      if (this.itStandardsForm.value.tcSoftwareVersion) {
        this.itStandardsForm.value.tcSoftwareVersionName = this.sharedService.findInArray(this.softwareVersions, 'id', this.itStandardsForm.value.tcSoftwareVersion, 'name');
        //console.log("SoftwareVersionName: ", this.itStandardsForm.value.tcSoftwareVersionName);
      }

      // add SoftwareReleaseName to payload
      if (this.itStandardsForm.value.tcSoftwareRelease) {
        this.itStandardsForm.value.tcSoftwareReleaseName = this.sharedService.findInArray(this.softwareReleases, 'id', this.itStandardsForm.value.tcSoftwareRelease, 'application');
        //console.log("SoftwareReleaseName: ", this.itStandardsForm.value.tcSoftwareReleaseName);
      }

      // add EndOfLifeDate to payload
      //if (this.itStandardsForm.value.tcEndOfLifeDate) {
        this.itStandardsForm.value.tcEndOfLifeDate = this.endOfLifeDate;
        console.log("EndOfLifeDate: ", this.itStandardsForm.value.tcEndOfLifeDate);
      //}


      //console.log("Form values before committing to database: ", this.itStandardsForm.value); // Debug

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
    this.tableService.itStandTableClick(data, false);
    $('#itStandardDetail').modal('show');
  }

  setApprovalExpirationDate(data: any) {
    try {
      if (data.endOfLifeDate  !== '' && data.endOfLifeDate !== null && data.endOfLifeDate !== undefined && data.endOfLifeDate !== 'null' && data.endOfLifeDate !== 'undefined') {
        console.log("setting approval expiration date to: ", data.endOfLifeDate); //DEBUG
        
        this.endOfLifeDate = new Date(data.endOfLifeDate);

        //console.log("new approval expiration date is: ", this.endOfLifeDate); //DEBUG

        //let newEndOfLifeDate = new Date(this.endOfLifeDate);

        // Set Approval Expiration Date on Date Picker
        $('#itStandAprvExp').datepicker('setDate', this.endOfLifeDate);
      }
    } catch (error) {
      //console.log("setApprovalExpirationDate error: ", error); //DEBUG
      console.log("No endOfLifeDate available"); //DEBUG
    }
  }

  manufacturerChange(manufacturer: any) {
    //console.log("Manufacturer changed to: ", manufacturer); //DEBUG

    this.softwareProductsLoading = true;
    this.itStandardsForm.get('tcSoftwareProduct')?.reset();
    this.itStandardsForm.get('tcSoftwareVersion')?.reset();
    this.itStandardsForm.get('tcSoftwareRelease')?.reset();

    try {
      if (manufacturer) {
        //console.log("(IF) Manufacturer ID: ", manufacturer["id"]); //DEBUG

        this.apiService.getSoftwareProducts(manufacturer["id"]).subscribe((data: any[]) => {
          this.softwareProducts = data;
          this.softwareProductsBuffer = this.softwareProducts.slice(0, this.bufferSize);
          this.softwareProductsLoading = false;
          this.enableSoftwareProduct();
          //this.disableSoftwareVersion();
        });
      } else {
        //console.log("(ELSE) Manufacturer ID: ", manufacturer["id"]); //DEBUG

        this.softwareProducts = [];
        this.softwareVersions = [];
        this.softwareReleases = [];
        this.softwareProductsLoading = false;
        this.softwareVersionsLoading = false;
        this.softwareReleasesLoading = false;
        //this.disableSoftwareProduct();
        //this.disableSoftwareVersion();
        //this.disableSoftwareRelease();
      }
    } catch (error) {
      //console.log("manufacturerChange Error: ", error); //DEBUG

      this.softwareProducts = [];
      this.softwareVersions = [];
      this.softwareReleases = [];
      this.softwareProductsLoading = false;
      this.softwareVersionsLoading = false;
      this.softwareReleasesLoading = false;
      //this.disableSoftwareProduct();
      //this.disableSoftwareVersion();
      //this.disableSoftwareRelease();
    }
  }

  softwareProductChange(softwareProduct: any) {
    //console.log("Software Product changed to: ", softwareProduct); //DEBUG

    this.softwareVersionsLoading = true;
    this.itStandardsForm.get('tcSoftwareVersion')?.reset();
    this.itStandardsForm.get('tcSoftwareRelease')?.reset();

    try {
      if (softwareProduct) {
        //console.log("Software Product ID: ", softwareProduct["id"]); //DEBUG

        this.apiService.getSoftwareVersions(softwareProduct["id"]).subscribe((data: any[]) => {
          this.softwareVersions = data;
          this.softwareVersionsBuffer = this.softwareVersions.slice(0, this.bufferSize);
          this.softwareVersionsLoading = false;
          this.enableSoftwareVersion();
          //this.disableSoftwareRelease();
        });
      } else {
        //console.log("Software Product ID: ", softwareProduct["id"]); //DEBUG

        this.softwareVersions = [];
        this.softwareReleases = [];
        this.softwareVersionsLoading = false;
        this.softwareReleasesLoading = false;
        //this.disableSoftwareVersion();
        //this.disableSoftwareRelease();
      }
    } catch (error) {
      //console.log("softwareProductChange Error: ", error); //DEBUG

      this.softwareVersions = [];
      this.softwareReleases = [];
      this.softwareVersionsLoading = false;
      this.softwareReleasesLoading = false;
      //this.disableSoftwareVersion();
      //this.disableSoftwareVersion();
    }
  }

  softwareVersionChange(softwareVersion: any) {
    //console.log("Software Version changed to: ", softwareVersion); //DEBUG

    this.softwareReleasesLoading = true;
    this.itStandardsForm.get('tcSoftwareRelease')?.reset();

    try {
      if (softwareVersion) {
        //console.log("(IF) Software Version ID: ", softwareVersion["id"]); //DEBUG

        this.apiService.getSoftwareReleases(softwareVersion["id"]).subscribe((data: any[]) => {
          this.softwareReleases = data;
          this.softwareReleasesBuffer = this.softwareReleases.slice(0, this.bufferSize);
          this.softwareReleasesLoading = false;
          this.enableSoftwareRelease();
        });
      } else {
        //console.log("(ELSE) Software Version ID: ", softwareVersion["id"]); //DEBUG

        this.softwareReleases = [];
        this.softwareReleasesLoading = false;
        //this.disableSoftwareRelease();
      }
    } catch (error) {
      //console.log("softwareVersionChange Error: ", error); //DEBUG

      this.softwareReleases = [];
      this.softwareReleasesLoading = false;
      //this.disableSoftwareRelease();
    }
  }

  // enable the software product field
  enableSoftwareProduct(): void {
    //console.log("Enabling Product");
    $("#divProduct").removeClass("disabledDivProduct");
  }

  disableSoftwareProduct(): void {
    //console.log("Disabling Product");
    $("#divProduct").addClass("disabledDivProduct");
  }

  // enable the software version field
  enableSoftwareVersion(): void {
    //console.log("Enabling Version");
    $("#divVersion").removeClass("disabledDivVersion");
  }

  disableSoftwareVersion(): void {
    //console.log("Disabling Version"); 
    $("#divVersion").addClass("disabledDivVersion");
  }

  // enable the software release field
  enableSoftwareRelease(): void {
    //console.log("Enabling Release");
    $("#divRelease").removeClass("disabledDivRelease");
  }

  disableSoftwareRelease(): void {
    //console.log("Disabling Release");
    $("#divRelease").addClass("disabledDivRelease");
  }

  disableOldITStandardName(): void {
    //console.log("Disabling Old Name");
    $("#divOldName").addClass("disabledDivOldName");
  }

}