import { Component, OnInit } from '@angular/core';
import { formatDate } from '@angular/common';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { Globals } from '@common/globals';

import { ApiService } from '@services/apis/api.service';
import { ModalsService } from '@services/modals/modals.service';
import { SharedService } from "@services/shared/shared.service";
import { TableService } from "@services/tables/table.service";
import { OperatingSystem } from '@api/models/operating-systems.model';
import { AppBundle } from '@api/models/it-standards-app-bundle.model';

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
    tcEndOfLifeDate: new FormControl(),
    itStandStatus: new FormControl(null, [Validators.required]),
    itStandName: new FormControl(null, [Validators.required]),
    itStandPOC: new FormControl(null, [Validators.required]),
    itStandDesc: new FormControl(),
    itStandType: new FormControl(null, [Validators.required]),
    itStandCategory: new FormControl(null, [Validators.required]),
    itStand508: new FormControl(),
    itStandMyView: new FormControl(),
    itStandReqAtte: new FormControl(null),
    itStandAtteLink: new FormControl(),
    itStandFedramp: new FormControl(),
    itStandOpenSource: new FormControl(),
    itStandRITM: new FormControl(),
    itStandVendorOrg: new FormControl(),
    itStandDeployment: new FormControl(null, [Validators.required]),
    itStandGoldImg: new FormControl(),
    itStandGoldComment: new FormControl(),
    itStandAprvExp: new FormControl(),
    itStandComments: new FormControl(),
    itStandRefDocs: new FormControl(),
    itStandApprovedVersions: new FormControl(),
    itStandOperatingSystems: new FormControl(),
    itStandMobileAppBundles: new FormControl()
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
  
  itStandReqAtteRefData: any = [];
  itStandReqAtteLoading = false;
  itStandReqAtteBuffer = [];

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

  anyServerError = false;

  operatingSystems: OperatingSystem[];

  allAppBundleIds: AppBundle[] = [];
  initalAppBundleIds: AppBundle[] = [];
  currentAppBundleId: string = '';
  showDuplicateAppBundleMsg: boolean = false;
  showAppBundleField: boolean = false;

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
      this.apiService.getCustomManufacturers().subscribe((cData: any[]) => {
        this.manufacturers = [...data, ...cData];
        this.manufacturersBuffer = this.manufacturers.slice(0, this.bufferSize);
        this.manufacturersLoading = false;
      });
    });

    // Populate Attestation Required Options
    this.itStandReqAtteLoading = true;
    this.apiService.getAttestationStatusTypes().subscribe((data: any[]) => {
      data.forEach(item => item.ID = item.ID.toString())
      this.itStandReqAtteRefData = data;
      this.itStandReqAtteBuffer = this.itStandReqAtteRefData.slice(0, this.bufferSize);
      this.itStandReqAtteLoading = false;
    });

    this.disableSoftwareProduct();
    this.disableSoftwareVersion();
    this.disableSoftwareRelease();

    // disable the End of Life Date field
    this.disableEndOfLifeDate();

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

    // Populate operating systems
    this.apiService.getOperatingSystems().subscribe((data: any[]) => { this.operatingSystems = data });

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

    // Reset Form Errors on any value update
    this.itStandardsForm.valueChanges.subscribe(change=>{  this.anyServerError = false; })
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
        itStandStatus: 2,
        itStandReqAtte: "1"
      });
    } else {

      // Set Approval Expiration Date on Date Picker
      const datecheck = new Date();
      if (this.itStandard.ApprovalExpirationDate !== null) {
        this.aprvExpDate = new Date(this.itStandard.ApprovalExpirationDate);
        $('#itStandAprvExp').datepicker('setDate', this.aprvExpDate);
      } else {
        this.aprvExpDate = twoYearsLater;
        $('#itStandAprvExp').datepicker('setDate', twoYearsLater);
      }

      // Set End of Life Date on Date
      if (this.itStandard.EndOfLifeDate !== null) {
        this.endOfLifeDate = new Date(this.itStandard.EndOfLifeDate);
      } else {
        this.endOfLifeDate = null;
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
        if (this.itStandard.SoftwareProduct) {
          this.softwareProductChange({ id: this.itStandard.SoftwareProduct, name: this.itStandard.SoftwareProductName });
          if (this.itStandard.SoftwareVersion) {
            this.softwareVersionChange({ id: this.itStandard.SoftwareVersion, name: this.itStandard.SoftwareVersionName });
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
      var myView = this.itStandard.Available_through_Myview === 'T';

      // Adjust Gold Image for rendering
      var goldImg = this.itStandard.Gold_Image === 'T';

      var fedramp = this.itStandard.fedramp === 'T';
      var openSource = this.itStandard.open_source === 'T';

      // Parse and find IDs for list of Categories
      var categoryIDs = [];
      if (this.itStandard.Category) {
        this.itStandard.Category.split(', ').forEach(cat => {
          categoryIDs.push(this.sharedService.findInArray(this.categories, 'Name', cat))
        });
      };

      let selectedOSList: string[] = [];
      if(this.itStandard.OperatingSystems) {
        selectedOSList = this.itStandard.OperatingSystems.split(', ');
      }

      // Get IT Standard App Bundles
      this.apiService.getITStandardAppBundles(this.itStandard.ID).subscribe((data: any) => { 
        this.allAppBundleIds = data.map(d => {
          let bundle = new AppBundle();
          bundle.ID = d.Id;
          bundle.Name = d.Keyname;
          return bundle;
        });

        // retain a copy of the original so we can use it to compare later on save
        this.initalAppBundleIds = [...this.allAppBundleIds];
      });

      // Set default values for form with current values
      this.itStandardsForm.patchValue({
        tcManufacturer: {id: this.itStandard.Manufacturer, name: this.itStandard.ManufacturerName},
        tcSoftwareProduct: {id: this.itStandard.SoftwareProduct, name: this.itStandard.SoftwareProductName},
        tcSoftwareVersion: {id: this.itStandard.SoftwareVersion, name: this.itStandard.SoftwareVersionName},
        tcSoftwareRelease: {id: this.itStandard.SoftwareRelease, name: this.itStandard.SoftwareReleaseName},
        tcEndOfLifeDate: (this.itStandard.EndOfLifeDate ? formatDate(this.itStandard.EndOfLifeDate, 'MMMM dd, yyyy', 'en-US') : null),
        itStandStatus: this.sharedService.findInArray(this.statuses, 'Name', this.itStandard.Status),
        itStandName: (!this.itStandard.OldName ? this.itStandard.SoftwareReleaseName : this.itStandard.OldName),
        itStandPOC: pocIDs,
        itStandDesc: this.itStandard.Description,
        itStandType: this.sharedService.findInArray(this.types, 'Name', this.itStandard.StandardType),
        itStandCategory: categoryIDs,
        itStand508: this.sharedService.findInArray(this.compliance, 'Name', this.itStandard.ComplianceStatus),
        itStandMyView: myView,
        itStandReqAtte: this.sharedService.findInArray(this.itStandReqAtteRefData, 'Name', this.itStandard.attestation_required),
        itStandAtteLink: this.itStandard.attestation_link,
        itStandFedramp: fedramp,
        itStandOpenSource: openSource,
        itStandRITM: this.itStandard.RITM === 'null' ? '' : this.itStandard.RITM,
        itStandVendorOrg: this.itStandard.Vendor_Standard_Organization,
        itStandDeployment: this.sharedService.findInArray(this.deploymentTypes, 'Name', this.itStandard.DeploymentType),
        itStandGoldImg: goldImg,
        itStandGoldComment: this.itStandard.Gold_Image_Comment,
        itStandAprvExp: formatDate(this.aprvExpDate, 'yyyy-MM-dd', 'en-US'),
        itStandComments: this.itStandard.Comments,
        itStandRefDocs: this.itStandard.ReferenceDocument,
        itStandApprovedVersions: this.itStandard.ApprovedVersions,
        itStandOperatingSystems: selectedOSList.map(o => this.sharedService.findInArray(this.operatingSystems, 'Name', o))
      });
      this.changeDeploymentType();
    }
  };

  submitForm() {
    if (this.itStandardsForm.valid) {
      // Adjust MyView & Gold Image for saving
      if (this.itStandardsForm.value.itStandMyView) this.itStandardsForm.value.itStandMyView = 'T';
      else this.itStandardsForm.value.itStandMyView = 'F';

      if (this.itStandardsForm.value.itStandGoldImg) this.itStandardsForm.value.itStandGoldImg = 'T';
      else this.itStandardsForm.value.itStandGoldImg = 'F';


      if (this.itStandardsForm.value.itStandFedramp) this.itStandardsForm.value.itStandFedramp = 'T';
      else this.itStandardsForm.value.itStandFedramp = 'F';

      if (this.itStandardsForm.value.itStandOpenSource) this.itStandardsForm.value.itStandOpenSource = 'T';
      else this.itStandardsForm.value.itStandOpenSource = 'F';

      // Set Date from Date Picker
      if ($('#itStandAprvExp').data('datepicker')) {
        this.itStandardsForm.value.itStandAprvExp = $('#itStandAprvExp').data('datepicker').getFormattedDate('yyyy-mm-dd');
      }

      // Adjust for N/A text fields
      if (!this.itStandardsForm.value.itStandVendorOrg) this.itStandardsForm.value.itStandVendorOrg = 'N/A';
      if (!this.itStandardsForm.value.itStandGoldComment) this.itStandardsForm.value.itStandGoldComment = 'N/A';
      if (!this.itStandardsForm.value.itStandComments) this.itStandardsForm.value.itStandComments = 'N/A';
      if (!this.itStandardsForm.value.itStand508) this.itStandardsForm.value.itStand508 = '3';
      if (!this.itStandardsForm.value.itStandAtteLink) this.itStandardsForm.value.itStandAtteLink = 'N/A';

      // Escape strings
      if(this.itStandardsForm.value.itStandDesc) {
        this.itStandardsForm.value.itStandDesc = this.escapeString(this.itStandardsForm.value.itStandDesc);
      }
      if(this.itStandardsForm.value.itStandVendorOrg) {
        this.itStandardsForm.value.itStandVendorOrg = this.escapeString(this.itStandardsForm.value.itStandVendorOrg);
      }
      if(this.itStandardsForm.value.itStandGoldComment) {
        this.itStandardsForm.value.itStandGoldComment = this.escapeString(this.itStandardsForm.value.itStandGoldComment);
      }
      if(this.itStandardsForm.value.itStandComments) {
        this.itStandardsForm.value.itStandComments = this.escapeString(this.itStandardsForm.value.itStandComments);
      }  
      if(this.itStandardsForm.value.itStandRefDocs) {
        this.itStandardsForm.value.itStandRefDocs = this.escapeString(this.itStandardsForm.value.itStandRefDocs);
      }
      
      // Add username to payload
      this.itStandardsForm.value.auditUser = this.globals.authUser;

      // add ManufacturerName to payload
      if (this.itStandardsForm.value.tcManufacturer) {
        this.itStandardsForm.value.tcManufacturerName = this.sharedService.findInArray(this.manufacturers, 'id', this.itStandardsForm.value.tcManufacturer, 'name');
      }

      // add SoftwareProductName to payload
      if (this.itStandardsForm.value.tcSoftwareProduct) {
        this.itStandardsForm.value.tcSoftwareProductName = this.sharedService.findInArray(this.softwareProducts, 'id', this.itStandardsForm.value.tcSoftwareProduct, 'name');
      }

      // add SoftwareVersionName to payload
      if (this.itStandardsForm.value.tcSoftwareVersion) {
        this.itStandardsForm.value.tcSoftwareVersionName = this.sharedService.findInArray(this.softwareVersions, 'id', this.itStandardsForm.value.tcSoftwareVersion, 'name');
      }

      // add SoftwareReleaseName to payload
      if (this.itStandardsForm.value.tcSoftwareRelease) {
        this.itStandardsForm.value.tcSoftwareReleaseName = this.sharedService.findInArray(this.softwareReleases, 'id', this.itStandardsForm.value.tcSoftwareRelease, 'application');
      }

      // add EndOfLifeDate to payload
      if (this.endOfLifeDate) {
        this.itStandardsForm.value.tcEndOfLifeDate = formatDate(this.endOfLifeDate, 'yyyy-MM-dd', 'en-US');
      }

      // add Attestation Status to payload
      if (this.itStandardsForm.value.itStandReqAtte && isNaN(this.itStandardsForm.value.itStandReqAtte)) {
        this.itStandardsForm.value.itStandReqAtte = this.sharedService.findInArray(this.itStandReqAtteRefData, 'Name', this.itStandardsForm.value.itStandReqAtte, 'ID');
      }

      if(this.allAppBundleIds && this.allAppBundleIds.length > 0) {
        this.itStandardsForm.value.itStandMobileAppBundles = this.allAppBundleIds;
        this.itStandardsForm.patchValue({itStandMobileAppBundles: this.allAppBundleIds});
      } else {
        this.itStandardsForm.value.itStandMobileAppBundles = [];
      }

      if(this.itStandardsForm.controls['itStandOperatingSystems'].value && this.itStandardsForm.controls['itStandOperatingSystems'].value.length > 0) {
        this.itStandardsForm.value.itStandOperatingSystems = this.itStandardsForm.controls['itStandOperatingSystems'].value;
      }

      // Get list of initial operating system so we can compare for update
      let initialOS: number[] = [];
      if(this.itStandard.OperatingSystems) {
        let initialOSString = this.itStandard.OperatingSystems.split(', ');
        initialOSString.forEach(o => initialOS.push(this.sharedService.findInArray(this.operatingSystems, 'Name', o)));
      }
      this.itStandardsForm.value.initialOS = initialOS;

      // Get list of initial app bundles so we an compare for update
      this.itStandardsForm.value.initialAppBundles = this.initalAppBundleIds;

      // if(this.hasCustomTechnoData()) {
      //   this.itStandardsForm.patchValue({tcSoftwareRelease: this.buildCustomRelease()});
      // }
      this.itStandardsForm.patchValue({tcSoftwareRelease: this.buildCustomRelease()});

      // Send data to database
      if(this.createBool) {

        this.apiService.createITStandard(this.itStandardsForm.value).toPromise().then(() => { 
          this.apiService.getLatestITStand().toPromise().then(initialCreateData => {
            this.apiService.createITStandardAdvanced(initialCreateData[0].ID, this.itStandardsForm.value).toPromise().then(() => {
              this.apiService.getOneITStandard(initialCreateData[0].ID).toPromise().then(finalCreateData => {
                this.itStandDetailRefresh(finalCreateData[0]);
              },
              (error) => {
                this.handleError("Save IT Standard", error);
              });
            },
            (error) => {
              this.handleError("Get Latest IT Standard Initial", error);
            });
          },
          (error) => {
            this.handleError("Save IT Standard Advanced", error);
          });
        },
        (error) => {
          this.handleError("Get Latest IT Standard Final", error);
        });
      } else {
        this.apiService.updateITStandard(this.itStandard.ID, this.itStandardsForm.value).toPromise().then(() => {
          this.apiService.getOneITStandard(this.itStandard.ID).toPromise().then(data => {
            this.itStandDetailRefresh(data[0]);
          });
        });
      }
      this.modalService.updateRecordCreation(false);  // Reset Creation flag
    }
  }

  private handleError(operation: string = 'operation', error: any) {
    console.log(`Failed ${operation} Call: ${JSON.stringify(error)}`);
    this.anyServerError = true;
  }

  itStandDetailRefresh(data: any) {
    this.showAppBundleField = false;
    this.showDuplicateAppBundleMsg = false;
    this.allAppBundleIds = [];
    this.initalAppBundleIds = [];
    this.currentAppBundleId = '';

    // Refresh Table
    $('#itStandardsTable').bootstrapTable('refresh');

    // Close Manager Modal and go back to showing Detail Modal
    $('#itStandardsManager').modal('hide');
    this.tableService.itStandTableClick(data, false);
    $('#itStandardDetail').modal('show');
  }

  hasValue(data : any) {
    // check if the tcManufacturer has a value?
    if (this.itStandardsForm.value[data]) {
      // check if the itstandname is not null
      if (this.itStandardsForm.value.itStandName) {
        return false;
      } else {
        return true;
      }
    } else {
      return false;
    }
  }

  // handles the software release change event
  softwareReleaseChange(data: any) {
    this.setApprovalExpirationDate(data);
    this.itStandardsForm.patchValue({itStandName: data.application});
  }

  // handles the endOfLifeDate change event
  setApprovalExpirationDate(data: any) {
    setTimeout(() => {
      try {
        if (data.endOfLifeDate  !== '' && data.endOfLifeDate !== null && data.endOfLifeDate !== undefined && data.endOfLifeDate !== 'null' && data.endOfLifeDate !== 'undefined') {

          let date = new Date(data.endOfLifeDate);

          // set the endOfLifeDate to the value from the database
          this.endOfLifeDate = date;

          // set the aprvExpDate
          this.aprvExpDate = date;

          // set the value of the endOfLifeDate field
          this.itStandardsForm.patchValue({ tcEndOfLifeDate: formatDate(this.endOfLifeDate, 'MMMM dd, yyyy', 'en-US') });

          // Set Approval Expiration Date on Date Picker
          $('#itStandAprvExp').datepicker('setDate', new Date (data.endOfLifeDate));
        } else {
          this.endOfLifeDate = null;
          this.itStandardsForm.patchValue({ tcEndOfLifeDate: null });
        }
      } catch (error) {
        this.endOfLifeDate = null;
        this.itStandardsForm.patchValue({ tcEndOfLifeDate: null });

      }
    }, 1000); // Wait 1 second before setting the date
  }

  // handles the formatting of the endOfLifeDate
  formatEndOfLifeDate(data: any) {
    // return the data as a string in the format Month dd, yyyy
    if (data === null || data === undefined || data === 'null' || data === 'undefined' || data === '') {
      return null;
    } else {
      return formatDate(data, 'MMMM dd, yyyy', 'en-US');
    }
  }

  isAssignedToitStandAprvExp(date1: any, date2: any) {
    setTimeout(() => {
      // if the ApprovalExpirationDate is not null
      if (this.endOfLifeDate) {
        const target = new Date(date1);
        const source = new Date(date2);
        target.setHours(0, 0, 0, 0);
        source.setHours(0, 0, 0, 0);
        if (target === source) {
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    }, 1200); // Wait 1 second before setting the date
  }

  isOldRecord(data: any) {
    // if the itStandName is not null, then true
    if (data !== null && data !== undefined && data !== 'null' && data !== 'undefined') {
      return true;
    } else {
      return false;
    }
  }

  // returns boolean true if the endOfLifeDate has passed, else false
  hasEndOfLifeDatePassed(data: any) {
    // if the endOfLifeDate is not null
    if (data !== null) {

      // get the endOfLifeDate as a Date object
      let date = new Date(data);

      // get today's date
      let today = new Date();

      // if the endOfLifeDate is before today's date
      if (date < today) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  manufacturerChange(manufacturer: any) {
    this.softwareProductsLoading = true;
    this.itStandardsForm.get('tcSoftwareProduct')?.reset();
    this.itStandardsForm.get('tcSoftwareVersion')?.reset();
    this.itStandardsForm.get('tcSoftwareRelease')?.reset();

    try {
      if (manufacturer) {
        if(manufacturer["id"]) {
          this.apiService.getSoftwareProducts(manufacturer["id"]).subscribe((data: any[]) => {
            this.apiService.getCustomSoftwareProducts(manufacturer["id"]).subscribe((cData: any[]) => {
              this.softwareProducts = [...data, ...cData];
              this.softwareProductsBuffer = this.softwareProducts.slice(0, this.bufferSize);
              this.softwareProductsLoading = false;
              this.enableSoftwareProduct();
            });
          });
        } else {
          this.softwareProductsLoading = false;
          this.enableSoftwareProduct();
        }

      } else {
        this.softwareProducts = [];
        this.softwareVersions = [];
        this.softwareReleases = [];
        this.softwareProductsLoading = false;
        this.softwareVersionsLoading = false;
        this.softwareReleasesLoading = false;
      }
    } catch (error) {
      this.softwareProducts = [];
      this.softwareVersions = [];
      this.softwareReleases = [];
      this.softwareProductsLoading = false;
      this.softwareVersionsLoading = false;
      this.softwareReleasesLoading = false;
    }
  }

  softwareProductChange(softwareProduct: any) {
    this.softwareVersionsLoading = true;
    this.itStandardsForm.get('tcSoftwareVersion')?.reset();
    this.itStandardsForm.get('tcSoftwareRelease')?.reset();

    try {
      if (softwareProduct) {
        if(softwareProduct["id"]) {
          this.apiService.getSoftwareVersions(softwareProduct["id"]).subscribe((data: any[]) => {
            this.apiService.getCustomSoftwareVersions(softwareProduct["id"]).subscribe((cData: any[]) => {
              this.softwareVersions = [...data, ...cData];
              this.softwareVersionsBuffer = this.softwareVersions.slice(0, this.bufferSize);
              this.softwareVersionsLoading = false;
              this.enableSoftwareVersion();
            });
          });
        } else {
          this.softwareVersionsLoading = false;
          this.enableSoftwareVersion();
        }
      } else {
        this.softwareVersions = [];
        this.softwareReleases = [];
        this.softwareVersionsLoading = false;
        this.softwareReleasesLoading = false;
      }
    } catch (error) {
      this.softwareVersions = [];
      this.softwareReleases = [];
      this.softwareVersionsLoading = false;
      this.softwareReleasesLoading = false;
    }
  }

  softwareVersionChange(softwareVersion: any) {
    this.softwareReleasesLoading = true;
    this.endOfLifeDate = null;
    this.itStandardsForm.patchValue({ tcEndOfLifeDate: null });
    this.itStandardsForm.get('tcSoftwareRelease')?.reset();

    try {
      if (softwareVersion) {
          this.apiService.getSoftwareReleases(softwareVersion["id"]).subscribe((data: any[]) => {
            this.apiService.getCustomSoftwareReleases(softwareVersion["id"]).subscribe((cData: any[]) => {
              this.softwareReleases = [...data, ...cData];
              this.softwareReleasesBuffer = this.softwareReleases.slice(0, this.bufferSize);
              this.softwareReleasesLoading = false;
            });
          });
      } else {
        this.softwareReleases = [];
        this.softwareReleasesLoading = false;
      }
    } catch (error) {
      this.softwareReleases = [];
      this.softwareReleasesLoading = false;
    }
  }

  // enable the software product field
  enableSoftwareProduct(): void {
    $("#divProduct").removeClass("disabledDivProduct");
  }

  disableSoftwareProduct(): void {
    $("#divProduct").addClass("disabledDivProduct");
  }

  // enable the software version field
  enableSoftwareVersion(): void {
    $("#divVersion").removeClass("disabledDivVersion");
  }

  disableSoftwareVersion(): void {
    $("#divVersion").addClass("disabledDivVersion");
  }

  // enable the software release field
  enableSoftwareRelease(): void {
    $("#divRelease").removeClass("disabledDivRelease");
  }

  disableSoftwareRelease(): void {
    $("#divRelease").addClass("disabledDivRelease");
  }

  disableEndOfLifeDate(): void {
    $("#divEndOfLifeDate").addClass("disabledDivEndOfLifeDate");
  }

  addAppBundleId() {
    this.showDuplicateAppBundleMsg = false;
    let appBundle = this.itStandardsForm.controls['itStandMobileAppBundles'].value;

    // only add to list if not already in the list
    let sameAppBundle = this.allAppBundleIds.findIndex(a => a.Name === appBundle);
    if(sameAppBundle < 0) {
      let tempAppBundle: AppBundle = { ID: 0, Name: appBundle};
      this.allAppBundleIds.push(tempAppBundle);
    } else {
      this.showDuplicateAppBundleMsg = true;
    }

    this.itStandardsForm.controls['itStandMobileAppBundles'].reset();
  }

  removeAppBundle(appBundle: string) {
    let appBundleIndex = this.allAppBundleIds.findIndex(a => a.Name === appBundle);
    if(appBundleIndex >= 0) {
      this.allAppBundleIds.splice(appBundleIndex, 1);
    }
  }

  changeDeploymentType() {
    if(this.itStandardsForm.value.itStandDeployment === 6 || this.itStandardsForm.value.itStandDeployment === '6') {
      this.showAppBundleField = true;
    } else {
      this.showAppBundleField = false;
    }
  }

  cleanup() {
    this.itStandardsForm = new FormGroup({
      tcManufacturer: new FormControl(null),
      tcSoftwareProduct: new FormControl(null),
      tcSoftwareVersion: new FormControl(null),
      tcSoftwareRelease: new FormControl(),
      tcEndOfLifeDate: new FormControl(),
      itStandStatus: new FormControl(null, [Validators.required]),
      itStandName: new FormControl(null, [Validators.required]),
      itStandPOC: new FormControl(null, [Validators.required]),
      itStandDesc: new FormControl(),
      itStandType: new FormControl(null, [Validators.required]),
      itStandCategory: new FormControl(null, [Validators.required]),
      itStand508: new FormControl(),
      itStandMyView: new FormControl(),
      itStandReqAtte: new FormControl(null),
      itStandAtteLink: new FormControl(),
      itStandFedramp: new FormControl(),
      itStandOpenSource: new FormControl(),
      itStandRITM: new FormControl(),
      itStandVendorOrg: new FormControl(),
      itStandDeployment: new FormControl(null, [Validators.required]),
      itStandGoldImg: new FormControl(),
      itStandGoldComment: new FormControl(),
      itStandAprvExp: new FormControl(),
      itStandComments: new FormControl(),
      itStandRefDocs: new FormControl(),
      itStandApprovedVersions: new FormControl(),
      itStandOperatingSystems: new FormControl(),
      itStandMobileAppBundles: new FormControl()
    });
    this.itStandard = {};
    this.createBool = false;
    this.statuses = [];
    this.manufacturers = [];
    this.manufacturersLoading = false;
    this.manufacturersBuffer = [];
    this.itStandReqAtteRefData = [];
    this.itStandReqAtteLoading = false;
    this.itStandReqAtteBuffer = [];
    this.softwareProducts = [];
    this.softwareProductsLoading = false;
    this.softwareProductsBuffer = [];
    this.softwareVersions = [];
    this.softwareVersionsLoading = false;
    this.softwareVersionsBuffer = [];
    this.softwareReleases = [];
    this.softwareReleasesLoading = false;
    this.softwareReleasesBuffer = [];
    this.endOfLifeDate = null;
    this.types = [];
    this.categories = [];
    this.catsLoading = false;
    this.catsBuffer = [];
    this.compliance = [];
    this.deploymentTypes = [];
    this.aprvExpDate = null;
    this.itStandCertify = false;
    this.anyServerError = false;
    this.operatingSystems = [];
    this.allAppBundleIds = [];
    this.initalAppBundleIds = [];
    this.currentAppBundleId = '';
    this.showDuplicateAppBundleMsg = false;
    this.showAppBundleField = false;

    // Populate Manufacturer Options
    this.manufacturersLoading = true;
    this.apiService.getManufacturers().subscribe((data: any[]) => {
      this.apiService.getCustomManufacturers().subscribe((cData: any[]) => {
        this.manufacturers = [...data, ...cData];
        this.manufacturersBuffer = this.manufacturers.slice(0, this.bufferSize);
        this.manufacturersLoading = false;
      });
    });

    // Populate Attestation Required Options
    this.itStandReqAtteLoading = true;
    this.apiService.getAttestationStatusTypes().subscribe((data: any[]) => {
      data.forEach(item => item.ID = item.ID.toString())
      this.itStandReqAtteRefData = data;
      this.itStandReqAtteBuffer = this.itStandReqAtteRefData.slice(0, this.bufferSize);
      this.itStandReqAtteLoading = false;
    });

    this.disableSoftwareProduct();
    this.disableSoftwareVersion();
    this.disableSoftwareRelease();

    // disable the End of Life Date field
    this.disableEndOfLifeDate();

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

    // Populate operating systems
    this.apiService.getOperatingSystems().subscribe((data: any[]) => { this.operatingSystems = data });

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

    // Reset Form Errors on any value update
    this.itStandardsForm.valueChanges.subscribe(change=>{  this.anyServerError = false; });
  }

  getCurrentSoftwareReleaseName(id: string) {
    if (this.softwareReleases) {
      return this.softwareReleases.find(s => s.id === id);
    }
  }

  escapeString(str: string) {
    return str.replace(/\\/g, "\\\\").replace(/[/"']/g, "\\$&");
  }

  isSelectedManufacturerCustom(): boolean {
    let foundIndex = this.manufacturers.findIndex(x => x.id === this.itStandardsForm.value.tcManufacturer.id);
    if(foundIndex) {
      return this.manufacturers[foundIndex].IsCustom;
    }
    return true;
  }

  isSelectedSoftwareProductCustom(): boolean {
    let foundIndex = this.softwareProducts.findIndex(x => x.id === this.itStandardsForm.value.tcSoftwareProduct.id);
    if(foundIndex) {
      return this.softwareProducts[foundIndex].IsCustom;
    }
    return true;
  }

  isSelectedSoftwareVersionCustom(): boolean {
    let foundIndex = this.softwareVersions.findIndex(x => x.id === this.itStandardsForm.value.tcSoftwareVersion.id);
    if(foundIndex) {
      return this.softwareVersions[foundIndex].IsCustom;
    }
    return true;
  }

  buildCustomRelease(): Object {
    let softwareRelease = {
      name: ''
    };

    if(this.hasAllCustomTechnoData()) {
      softwareRelease.name = `${this.itStandardsForm.value.tcManufacturer.name} 
                ${this.itStandardsForm.value.tcSoftwareProduct.name} 
                ${this.itStandardsForm.value.tcSoftwareVersion.name}`;
    } else {
      softwareRelease.name = this.itStandardsForm.value.itStandName;
    }

    return softwareRelease;
  }

  hasCustomTechnoData(): boolean {
    return !this.itStandardsForm.value.tcManufacturer.id ||
            !this.itStandardsForm.value.tcSoftwareProduct.id ||
            !this.itStandardsForm.value.tcSoftwareVersion.id
  }

  hasAllCustomTechnoData(): boolean {
    return !this.itStandardsForm.value.tcManufacturer.id &&
            !this.itStandardsForm.value.tcSoftwareProduct.id &&
            !this.itStandardsForm.value.tcSoftwareVersion.id;
  }

  getTitleName(): string {
    if(this.itStandard.SoftwareReleaseName) {
      return this.itStandard.SoftwareReleaseName;
    } else {
      return this.itStandard.Name;
    }
  }

}
