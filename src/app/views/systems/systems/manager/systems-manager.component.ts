import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Capability } from '@api/models/capabilities.model';
import { System } from '@api/models/systems.model';

import { Globals } from '@common/globals';

import { ApiService } from '@services/apis/api.service';
import { ModalsService } from '@services/modals/modals.service';
import { SharedService } from "@services/shared/shared.service";
import { TableService } from "@services/tables/table.service";

// Declare jQuery symbol
declare var $: any;

@Component({
    selector: 'systems-manager',
    templateUrl: './systems-manager.component.html',
    styleUrls: ['./systems-manager.component.scss'],
    standalone: false
})
export class SystemsManagerComponent implements OnInit {

  public systemId: number = null;
  public detailsData: System = null;
  public isDataReady: boolean = false;

  public isBusCapTabActive: boolean = true;
  public isInvestmentsTabActive: boolean = false;
  public isStandardTabActive: boolean = false;

  systemForm: FormGroup = new FormGroup({
    relatedCaps: new FormControl(),
    relatedInvest: new FormControl(),
    relatedTech: new FormControl()
  });

  // system = <any>{};

  busCapPool: any[] = [];
  capRelations: any[] = [];
  notSelectedCaps: any[] = [];
  selectedCapsIDs: Set<any> = new Set();

  investPool: any[] = [];
  investRelations: any[] = [];
  notSelectedInvest: any[] = [];
  selectedInvestIDs: Set<any> = new Set();

  techPool: any[] = [];
  techRelations: any[] = [];
  notSelectedTech: any[] = [];
  selectedTechIDs: Set<any> = new Set();

  systemCertify: boolean = false;

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
      this.systemId = +params.get('sysID');

      this.apiService.getOneSys(this.systemId).subscribe(sys => {
        this.detailsData = sys;
      });

      this.setFormDefaults();
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

  public onTabClick(tabName: string, event: Event): void {
    event.preventDefault();
    switch (tabName) {
      case 'buscap':
        this.isBusCapTabActive = true;
        this.isInvestmentsTabActive = false;
        this.isStandardTabActive = false;
        break;
      case 'investments':
        this.isBusCapTabActive = false;
        this.isInvestmentsTabActive = true;
        this.isStandardTabActive = false;
        break;
      case 'standard':
        this.isBusCapTabActive = false;
        this.isInvestmentsTabActive = false;
        this.isStandardTabActive = true;
        break;
      default:
        break;
    }
  }

  setFormDefaults(): void {
    // Populate Related Capabilities
    this.apiService.getSysCapabilities(this.systemId).subscribe((data: any[]) => {
      this.capRelations = [];
      // Only take ID and name
      data.forEach(element => {
        this.capRelations.push({
          ID: element.ID,
          Name: element.Name,
          ReferenceNum: element.ReferenceNum
        })
      });
    });
  
    // Populate Business Capabilities Pool minus related ones
    this.apiService.getCapabilities().toPromise()
      .then((data: any[]) => {
        this.busCapPool = [];
        // Only take ID, name, and reference num
        data.forEach(element => {
          // Filter to only 2 bottom levels (not including root capability)
          if ((element.Level === 'BRM Business Service' || element.Level === 'GSA Business Capability') && element.ReferenceNum !== '-') {
            this.busCapPool.push({
              ID: element.ID,
              Name: element.Name,
              ReferenceNum: element.ReferenceNum
            })
          };
        });
        this.selectedCapsIDs = new Set();
        this.notSelectedCaps = this.busCapPool;

        // Take related caps IDs and remove them from the busCapPool list
        // to include only capabilities that are not related to this system
        this.selectedCapsIDs = new Set(this.capRelations.map(({ ID }) => ID));
        this.notSelectedCaps = this.busCapPool.filter(({ ID }) => !this.selectedCapsIDs.has(ID));

        // Set default values for form with current values after resolving related caps
        this.systemForm.patchValue({
          relatedCaps: this.selectedCapsIDs
        });
    });


    // Populate Related Investments
    this.apiService.getSysInvestments(this.systemId).subscribe((data: any[]) => {
      this.investRelations = [];
      // Only take ID and name
      data.forEach(element => {
        this.investRelations.push({
          ID: element.ID,
          Name: element.Name
        })
      });
    });

    // Populate Investments Pool minus related ones
    this.apiService.getInvestments().toPromise()
      .then((data: any[]) => {
        this.investPool = [];
        // Only take ID and name
        data.forEach(element => {
          this.investPool.push({
            ID: element.ID,
            Name: element.Name
          })
        });
        this.selectedInvestIDs = new Set();
        this.notSelectedInvest = this.investPool;

        // Take related investment IDs and remove them from the investPool list
        // to include only Investments that are not related to this system
        this.selectedInvestIDs = new Set(this.investRelations.map(({ ID }) => ID));
        this.notSelectedInvest = this.investPool.filter(({ ID }) => !this.selectedInvestIDs.has(ID));

        // Set default values for form with current values after resolving related caps
        this.systemForm.patchValue({
          relatedInvest: this.selectedInvestIDs
        });
    });


    // Populate Related IT Standards
    this.apiService.getSysITStandards(this.systemId).subscribe((data: any[]) => {
      this.techRelations = [];
      // Only take ID and name
      data.forEach(element => {
        this.techRelations.push({
          ID: element.ID,
          Name: element.Name,
          Category: element.Category
        })
      });
    });

    // Populate IT Standards Pool minus related ones
    this.apiService.getITStandards().toPromise()
      .then((data: any[]) => {
        this.techPool = [];
        // Only take ID and name
        data.forEach(element => {
          this.techPool.push({
            ID: element.ID,
            Name: element.Name,
            Category: element.Category
          })
        });
        this.selectedTechIDs = new Set();
        this.notSelectedTech = this.techPool;

        // Take related tech IDs and remove them from the techPool list
        // to include only IT Standards that are not related to this system
        this.selectedTechIDs = new Set(this.techRelations.map(({ ID }) => ID));
        this.notSelectedTech = this.techPool.filter(({ ID }) => !this.selectedTechIDs.has(ID));

        // Set default values for form with current values after resolving related caps
        this.systemForm.patchValue({
          relatedTech: this.selectedTechIDs
        });
    });
  this.isDataReady = true;
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
    this.notSelectedCaps = this.busCapPool.filter(({ ID }) => !this.selectedCapsIDs.has(ID));
    this.capRelations = this.busCapPool.filter(({ ID }) => this.selectedCapsIDs.has(ID));
    
    this.notSelectedInvest = this.investPool.filter(({ ID }) => !this.selectedInvestIDs.has(ID));
    this.techRelations = this.investPool.filter(({ ID }) => this.selectedInvestIDs.has(ID));
    
    this.notSelectedTech = this.techPool.filter(({ ID }) => !this.selectedTechIDs.has(ID));
    this.techRelations = this.techPool.filter(({ ID }) => this.selectedTechIDs.has(ID));

    // Update form value with selected IDs
    this.systemForm.patchValue({
      relatedCaps: this.selectedCapsIDs,
      relatedInvest: this.selectedInvestIDs,
      relatedTech: this.selectedTechIDs
    });
  };

  submitForm() {
    // console.log("Form: ", this.systemForm);  // Debug

    if (this.systemForm.valid) {
      // Change de/selected IDs to array from set
      if (this.systemForm.value.relatedCaps) {
        this.systemForm.value.relatedCaps = Array.from(this.systemForm.value.relatedCaps);
      };
      if (this.systemForm.value.relatedInvest) {
        this.systemForm.value.relatedInvest = Array.from(this.systemForm.value.relatedInvest);
      };
      if (this.systemForm.value.relatedTech) {
        this.systemForm.value.relatedTech = Array.from(this.systemForm.value.relatedTech);
      };

      // console.log("Form values before committing to database: ", this.systemForm.value); // Debug

      // Send data to database
      this.apiService.updateSystemCaps(this.systemId, this.systemForm.value).toPromise()
        .then(res => {
          // Grab new data from database
          this.apiService.getOneSys(this.systemId).toPromise()
            .then(),
            (error) => {
              console.log("GET Updated System rejected with " + JSON.stringify(error));
            };
        });

      this.apiService.updateSystemInvestments(this.systemId, this.systemForm.value).toPromise()
        .then(res => {
          // Grab new data from database
          this.apiService.getOneSys(this.systemId).toPromise()
            .then(),
            (error) => {
              console.log("GET Updated System rejected with " + JSON.stringify(error));
            };
        });

      this.apiService.updateSystemTech(this.systemId, this.systemForm.value).toPromise()
        .then(res => {
          // Grab new data from database
          this.apiService.getOneSys(this.systemId).toPromise()
            .then(),
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
