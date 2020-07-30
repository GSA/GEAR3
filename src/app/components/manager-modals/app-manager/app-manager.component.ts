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
  selector: 'app-manager',
  templateUrl: './app-manager.component.html',
  styleUrls: ['./app-manager.component.css']
})
export class AppManagerComponent implements OnInit {

  appForm: FormGroup = new FormGroup({
    appStatus: new FormControl(null, [Validators.required]),
    appOrWeb: new FormControl(null, [Validators.required]),
    appName: new FormControl(null, [Validators.required]),
    appDisplayName: new FormControl(null, [Validators.required]),
    appDesc: new FormControl(),
    appNotes: new FormControl(),

    appUID: new FormControl(null, [Validators.required]),
    appCUI: new FormControl(),
    appProdYr: new FormControl(),
    appRetiredYr: new FormControl(),
    appBizPOC: new FormControl(null, [Validators.required]),
    appOwner: new FormControl(null, [Validators.required]),

    appCloud: new FormControl(),
    // appDesktop: new FormControl(),
    appMobile: new FormControl(),
    appHost: new FormControl(null, [Validators.required]),
    appTechPOC: new FormControl(null, [Validators.required]),
    appFISMA: new FormControl(),
    appParent: new FormControl(),
    relatedTech: new FormControl(),
    TIMEFY19: new FormControl(null, [Validators.required]),
    TIMEFY20: new FormControl(null, [Validators.required]),
    TIMEFY21: new FormControl(null, [Validators.required]),
    TIMEFY22: new FormControl(null, [Validators.required]),
    TIMEFY23: new FormControl(null, [Validators.required]),
    TIMEFY24: new FormControl(null, [Validators.required]),
    TIMENotes: new FormControl()
  });

  application = <any>{};
  createBool: any;
  statuses: any[];
  POCs: any[] = [];
  orgs: any[] = [];
  hosts: any[] = [];
  fismaSystems: any[] = [];
  parentSystems: any[] = [];

  techPool: any[] = [];
  techRelations: any[] = [];
  notSelected: any[] = [];
  selectedIDs: Set<any> = new Set();
  deSelectedIDs: Set<any> = new Set();

  TIMEYears = ['FY19', 'FY20', 'FY21', 'FY22', 'FY23', 'FY24'];
  TIMEValues = ['T1', 'T2', 'T3', 'I', 'M1', 'M2', 'E', 'TBD', 'N/A'];

  constructor(
    private apiService: ApiService,
    private globals: Globals,
    private modalService: ModalsService,
    private sharedService: SharedService,
    private tableService: TableService) { }

  ngOnInit(): void {
    // Emit setFormDefaults for when edit button is pressed
    if (this.sharedService.appFormSub == undefined) {
      this.sharedService.appFormSub = this.sharedService.appFormEmitter.subscribe(() => { this.setFormDefaults(); });
    }

    this.modalService.currentApp.subscribe(application => this.application = application);
    this.modalService.currentCreate.subscribe(createBool => this.createBool = createBool);

    // Populate Statuses
    this.apiService.getAppStatuses().subscribe((data: any[]) => { this.statuses = data; });

    // Populate POCs
    this.apiService.getPOCs().subscribe((data: any[]) => { this.POCs = data; });

    // Populate Orgs
    this.apiService.getOrganizations().subscribe((data: any[]) => { this.orgs = data; });

    // Populate Hosting Providers
    this.apiService.getHostProviders().subscribe((data: any[]) => { this.hosts = data; });

    // Populate FISMA Systems
    this.apiService.getFISMA().subscribe((data: any[]) => { this.fismaSystems = data; });

    // Populate Parent Systems
    this.apiService.getSystems().subscribe((data: any[]) => { this.parentSystems = data; });

    // If the manager modal is exited, clear the create flag
    $('#appManager').on('hide.bs.modal', function (e) {
      this.modalService.updateRecordCreation(false);
    }.bind(this));
  }


  setFormDefaults(): void {
    // Only set status default for creating new record
    if (this.createBool) {
      this.appForm.reset();  // Clear any erroneous values if any
      this.appForm.patchValue({
        appStatus: 1
      });

      // Populate All IT Standards Pool
      this.techRelations = [];
      this.apiService.getITStandards().toPromise()
        .then((data: any[]) => {
          this.techPool = [];
          // Only take ID and name
          data.forEach(element => {
            this.techPool.push({
              ID: element.ID,
              Name: element.Name,
              Status: element.Status
            })
          });
          this.selectedIDs = new Set();
          this.notSelected = this.techPool;
        });
    } else {
      // Populate Related Technologies
      this.apiService.getAppTechnologies(this.application.ID).subscribe((data: any[]) => {
        this.techRelations = [];
        // Only take ID and name
        data.forEach(element => {
          // Filter to only grab approved or exception status standards
          if (element.Status === 'Approved' || element.Status === 'Exception') {
            this.techRelations.push({
              ID: element.ID,
              Name: element.Name,
              Status: element.Status
            })
          }
        });
      });

      // Populate All Technologies Pool minus related tech
      this.apiService.getITStandards().toPromise()
        .then((data: any[]) => {
          this.techPool = [];
          // Only take ID and name
          data.forEach(element => {
            // Filter to only grab approved or exception status standards
            if (element.Status === 'Approved' || element.Status === 'Exception') {
              this.techPool.push({
                ID: element.ID,
                Name: element.Name,
                Status: element.Status
              })
            }
          });

          // Take related tech IDs and remove them from the techPool list
          this.selectedIDs = new Set(this.techRelations.map(({ ID }) => ID));
          this.notSelected = this.techPool.filter(({ ID }) => !this.selectedIDs.has(ID));

          // Parse and find IDs for list of POCs
          var bizPocIDs = [];
          var techPocIDs = [];
          if (this.application.BusPOC) {
            this.application.BusPOC.split(', ').forEach(poc => {
              bizPocIDs.push(this.sharedService.findInArrayID(this.POCs, 'Name', poc))
            });
          };
          if (this.application.TechPOC) {
            this.application.TechPOC.split(', ').forEach(poc => {
              techPocIDs.push(this.sharedService.findInArrayID(this.POCs, 'Name', poc))
            });
          };

          // Adjust cloud & mobile statuses for rendering
          if (this.application.Cloud === 'Yes') var cloudStatus = true;
          else var cloudStatus = false;

          if (this.application.Mobile_App_Indicator === 'Yes') var mobileStatus = true;
          else var mobileStatus = false;

          // Set default values for form with current values after resolving related apps
          this.appForm.patchValue({
            appStatus: this.sharedService.findInArrayID(this.statuses, 'Name', this.application.Status),
            appOrWeb: this.application.Application_or_Website,
            appName: this.application.Name,
            appDisplayName: this.application.DisplayName,
            appDesc: this.application.Description,
            appNotes: this.application.Application_Notes,

            appUID: this.application.OMBUID,
            appCUI: this.application.CUI,
            appProdYr: this.application.ProdYear,
            appRetiredYr: this.application.RetiredYear,
            appBizPOC: bizPocIDs,
            appOwner: this.sharedService.findInArrayID(this.orgs, 'Name', this.application.Owner),

            appCloud: cloudStatus,
            // appDesktop: this.application.Desktop_Indicator,
            appMobile: mobileStatus,
            appHost: this.sharedService.findInArrayID(this.hosts, 'Name', this.application.HostingProvider),
            appTechPOC: techPocIDs,
            appFISMA: this.sharedService.findInArrayID(this.fismaSystems, 'Name', this.application.FISMASystem),
            appParent: this.application.ParentSystemID,
            relatedTech: this.selectedIDs,
            TIMEFY19: this.sharedService.FYFormatter(null, this.application, null, 'FY19'),
            TIMEFY20: this.sharedService.FYFormatter(null, this.application, null, 'FY20'),
            TIMEFY21: this.sharedService.FYFormatter(null, this.application, null, 'FY21'),
            TIMEFY22: this.sharedService.FYFormatter(null, this.application, null, 'FY22'),
            TIMEFY23: this.sharedService.FYFormatter(null, this.application, null, 'FY23'),
            TIMEFY24: this.sharedService.FYFormatter(null, this.application, null, 'FY24'),
            TIMENotes: this.application.TIME_Notes
          });
        }),
        (error) => {
          console.log("Getting applications rejected with " + JSON.stringify(error));
        };
    }
  };

  poolToSelected() {
    // Add to selected list
    let poolVals = $('#standardsPool').val().map(x => +x)
    poolVals.forEach(val => {
      this.deSelectedIDs.delete(val);
      this.selectedIDs.add(val);
    });
    this.updateSelectLists();
  };

  selectedToPool() {
    // Delete from selected list
    let selectedVals = $('#standardsSelect').val().map(x => +x)
    selectedVals.forEach(val => {
      this.deSelectedIDs.add(val);
      this.selectedIDs.delete(val);
    });
    this.updateSelectLists();
  };

  updateSelectLists() {
    // Update app pool and child apps lists of options
    this.notSelected = this.techPool.filter(({ ID }) => !this.selectedIDs.has(ID));
    this.techRelations = this.techPool.filter(({ ID }) => this.selectedIDs.has(ID));

    // Update form value with selected IDs
    this.appForm.patchValue({
      sysChildApps: this.selectedIDs,
      deselectedApps: this.deSelectedIDs
    });
  };

  submitForm() {
    // console.log("Form: ", this.appForm);  // Debug

    if (this.appForm.valid) {
      // Add username to payload
      this.appForm.value.auditUser = this.globals.authUser;

      // Change selected IDs to array from set
      if (this.appForm.value.relatedTech) {
        this.appForm.value.relatedTech = Array.from(this.appForm.value.relatedTech);
      };

      // Set SSO ID based on Owning Org by finding owner name first
      var ownerName;
      for (let index = 0; index < this.orgs.length; index++) {
        const element = this.orgs[index];
        if (element.ID == this.appForm.value.appOwner) {
          ownerName = element.Name;
          break;
        }
      };
      this.appForm.value.appSSO = this.findSSO(ownerName);

      // Adjust cloud & mobile statuses for saving
      if (this.appForm.value.appCloud) this.appForm.value.appCloud = 'Yes';
      else this.appForm.value.appCloud = 'No';

      if (this.appForm.value.appMobile) this.appForm.value.appMobile = 'Yes';
      else this.appForm.value.appMobile = 'No';

      // console.log("Form values before committing to database: ", this.appForm.value); // Debug

      // Send data to database
      if (this.createBool) {
        this.apiService.createApplication(this.appForm.value).toPromise()
          .then(res => {
            // Grab new data from database
            this.apiService.getLatestApp().toPromise()
              .then((data: any) => {
                // Update POCs with new ID
                this.apiService.updateApplication(data[0].ID, this.appForm.value).toPromise()
                  .then(res => {
                    // Now get all the complete new data
                    this.apiService.getLatestApp().toPromise()
                      .then(data => {
                        // Then update the details modal
                        this.appDetailRefresh(data[0])
                      })
                  }),
                  (error) => {
                    console.log("Update after creating appliction rejected with " + JSON.stringify(error));
                  };
              }),
              (error) => {
                console.log("GET latest application rejected with " + JSON.stringify(error));
              };
          });
      } else {
        this.apiService.updateApplication(this.application.ID, this.appForm.value).toPromise()
          .then(res => {
            // Grab new data from database
            this.apiService.getOneApp(this.application.ID).toPromise()
              .then(data => { this.appDetailRefresh(data[0]) }),
              (error) => {
                console.log("GET Updated application rejected with " + JSON.stringify(error));
              };
          });
      }

      this.modalService.updateRecordCreation(false);  // Reset Creation flag
    }
  };

  pocMatch(pocName) {
    if (this.application.BusPOC) {
      return this.application.BusPOC.includes(pocName)
    }
    return false;
  }

  findSSO(org) {
    // Loop through each org
    for (let index = 0; index < this.orgs.length; index++) {
      const element = this.orgs[index];

      // If found org, recurse through parent
      if (element.Name === org) {
        // If admin is parent, found SSO
        if (element.Parent === 'Office of the Administrator (A)') {
          return element.ID;
        }
        else return this.findSSO(element.Parent);
      }
    };

    return null;
  }

  timeMatch(year, timeVal) {
    var selectedVal = this.sharedService.FYFormatter(null, this.application, null, year)

    if (timeVal === selectedVal) return true;
    return false;
  }

  appDetailRefresh(data: any) {
    // Refresh Table
    $('#appsTable').bootstrapTable('refresh');

    // Close Manager Modal and go back to showing Detail Modal
    $('#appManager').modal('hide');
    this.tableService.appsTableClick(data);
    $('#appDetail').modal('show');
  };

}
