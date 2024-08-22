import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

import { ModalsService } from '@services/modals/modals.service';
import { SharedService } from "@services/shared/shared.service";
import { TableService } from '@services/tables/table.service';
import { ApiService } from '@services/apis/api.service';
import { TechAttributeDefinitions } from '@api/models/tech-attribute-definitions';
import { DataDictionary } from '@api/models/data-dictionary.model';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'it-standards-modal',
  templateUrl: './it-standards-modal.component.html',
  styleUrls: ['./it-standards-modal.component.scss']
})
export class ItStandardsModalComponent implements OnInit {

  itStandard = <any>{};
  attrDefinitions = <DataDictionary[]>[];

  STATUS_STATES = {
    approved: 'Approved',
    pilot: 'Pilot',
    propsed: 'Proposed',
    retired: 'Retired',
    denied: 'Denied'
  };

  COMPLIANCE_STATES = {
    fullyCompliant: 'Fully Compliant',
    complianceUnknown: 'Compliance Unknown',
    partiallyCompliant: 'Partially Compliant',
    notCompliant: 'Not Compliant'
  };

  showAllFields = false;

  constructor(
    private location: Location,
    public modalService: ModalsService,
    private router: Router,
    public sharedService: SharedService,
    public tableService: TableService,
    public apiService: ApiService) { }



  ngOnInit(): void {
    this.modalService.currentITStand.subscribe(itStandard => {
      this.itStandard = itStandard;
      console.log(this.itStandard);
    });
    

    $('#itRelSysTable').bootstrapTable($.extend(this.tableService.relSysTableOptions, {
      columns: this.tableService.relSysColumnDefs,
      data: [],
    }));

    const self = this;
    // Method to handle click events on the Related Systems table
    $(document).ready(() => {
      $('#itRelSysTable').on('click-row.bs.table', function (e, row) {
        // Hide First Modal before showing new modal
        $('#itStandardDetail').modal('hide');

        self.tableService.systemsTableClick(row);
      }.bind(this));
    });

    // Revert back to overview tab when modal goes away
    $('#itStandardDetail').on('hidden.bs.modal', function (e) {
      $("#itStandTabs li:first-child a").tab('show');

      // Change URL back without ID after closing Modal
      this.sharedService.removeIDfromURL();
    }.bind(this));

    // Get attribute definition list
    this.apiService.getDataDictionaryByReportName('IT Standards List')
      .subscribe((data: DataDictionary[]) => {
        this.attrDefinitions = data;
        
    });
  }

  itStandEdit () {
    // Hide Detail Modal before showing Manager Modal
    $('#itStandardDetail').modal('hide');
    this.modalService.updateDetails(this.itStandard, 'it-standard', false);
    this.sharedService.setITStandardsForm();
    $('#itStandardsManager').modal('show');
  }

  
  getTitle (title1: string, title2: string): string {
    return (title1) ? title1 : title2;
  }

  getTooltip (name: string): string {
    // TODO: Remove this and add it to the db whenever the ApprovedVersions field becomes available
    if(name === 'ApprovedVersions') {
      return `Unless otherwise stated, all minor versions share the same approval 
      status as the version listed. For example, if version “1.0” is listed and has
       a status of “Approved”, then version 1.1, 1.2, 1.3, etc. are also approved. 
       Unless otherwise stated, all minor versions share the same approval status as 
       the version listed. For example, if version “1.0” is listed and has a status 
       of “Approved”, then version 1.1, 1.2, 1.3, etc. are also approved.`;
    } else {
      const def = this.attrDefinitions.find(def => def.Term === name);
      if(def){
        return def.TermDefinition;
      }
      return '';
    }
  }

  getStatusIconColor(status: string) {
    if(status === this.STATUS_STATES.approved) {
      return 'green';
    }

    if(status === this.STATUS_STATES.pilot || status === this.STATUS_STATES.propsed) {
      return 'yellow';
    }

    if(status === this.STATUS_STATES.retired || status === this.STATUS_STATES.denied) {
      return 'red';
    }
  }

  getComplianceIconColor(compliance: string) {
    if(compliance === this.COMPLIANCE_STATES.fullyCompliant) {
      return 'green';
    }

    if(compliance === this.COMPLIANCE_STATES.complianceUnknown || compliance === this.COMPLIANCE_STATES.partiallyCompliant) {
      return 'yellow';
    }

    if(compliance === this.COMPLIANCE_STATES.notCompliant) {
      return 'red';
    }
  }

  getApprovalExpDateIconColor(approvalExpDate: string) {
    const today = new Date();
    const currentYear = new Date().getFullYear();
    let expDate = new Date(approvalExpDate);

    if(expDate > today && expDate.getFullYear() !== currentYear) {
      return 'green';
    } else if(expDate < today) {
      return 'red';
    } else {
      return 'yellow';
    }
  }

  isFieldPopulated(field: any) {
    return (field !== '' && field !== 'N/A' && field !== null) || this.showAllFields;
  }

  isApproved() {
    return this.itStandard.Status === this.STATUS_STATES.approved;
  }

  getStatusIconTooltip() {
    return `
    Green indicates an approved status.
    Yellow indicates a pilot or propsed status.
    Red indicates a denied or retired status.
    `;
  }

  getComplianceIconTooltip() {
    return `
      Green indicates the software is fully compliant.
      Yellow indicates the software is partially compliant or the compliance is unknown.
      Red indicates the software has no compliance.
    `;
  }

  getApprovalExpDateIconTooltip() {
    return `
      Green indicates the approval expires in the future.
      Yellow indicates the approval expires this year but is still currently approved.
      Red indicates the approval has already expired.
    `;
  }

  toggleShowAllFields() {
    this.showAllFields = !this.showAllFields;
  }

}
