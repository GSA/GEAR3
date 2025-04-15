import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DataDictionary } from '@api/models/data-dictionary.model';
import { AppBundle } from '@api/models/it-standards-app-bundle.model';
import { ITStandards } from '@api/models/it-standards.model';
import { ApiService } from '@services/apis/api.service';

@Component({
  selector: 'it-standards',
  templateUrl: './it-standards-details.component.html',
  styleUrls: ['./it-standards-details.component.scss'],
})
export class ItStandardsDetailsComponent implements OnInit {

  STATUS_STATES = {
    approved: 'Approved',
    pilot: 'Pilot',
    propsed: 'Proposed',
    retired: 'Retired',
    denied: 'Denied',
    expired: 'Expired'
  };

  COMPLIANCE_STATES = {
    fullyCompliant: 'Fully Compliant',
    complianceUnknown: 'Compliance Unknown',
    partiallyCompliant: 'Partially Compliant',
    notCompliant: 'Not Compliant'
  };

  DEPLOYMENT_TYPES = {
    desktop: 'Desktop',
    mobile: 'Mobile',
    server: 'Server'
  };

  public itStandardId: number = null;
  public detailsData: ITStandards;
  public showAllFields: boolean = false;
  public attrDefinitions = <DataDictionary[]>[];
  public isDataReady: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService
  ) {
  }

  public ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.itStandardId = +params.get('standardID');

      this.apiService.getOneITStandard(this.itStandardId).subscribe(s => {
        this.detailsData = s;
        this.isDataReady = true;
      });

      // Get attribute definition list
      this.apiService.getDataDictionaryByReportName('IT Standards List')
        .subscribe((data: DataDictionary[]) => {
          this.attrDefinitions = data;
      });
    });
  }

  public getStatusClass(status: string): string {
    if(status === this.STATUS_STATES.approved) {
      return 'status-green';
    } else if(status === this.STATUS_STATES.denied || status === this.STATUS_STATES.expired || status === this.STATUS_STATES.retired) {
      return 'status-red';
    } else {
      return 'status-yellow';
    }
  }

  public getDateStatusCircle(date: Date): string {
    const today = new Date();
    const currentYear = new Date().getFullYear();
    let expDate = new Date(date);

    if(expDate > today && expDate.getFullYear() !== currentYear) {
      return 'circle-green';
    } else if(expDate < today) {
      return 'circle-red';
    } else {
      return 'circle-yellow';
    }
  }

  public getComplianceStatusCircle(compliance: string) {
    if(compliance === this.COMPLIANCE_STATES.fullyCompliant) {
      return 'circle-green';
    }

    if(compliance === this.COMPLIANCE_STATES.complianceUnknown || compliance === this.COMPLIANCE_STATES.partiallyCompliant) {
      return 'circle-yellow';
    }

    if(compliance === this.COMPLIANCE_STATES.notCompliant) {
      return 'circle-red';
    }
  }

  public getDeploymentTypeIcon(deployementType: string) : string {
    if(deployementType === this.DEPLOYMENT_TYPES.desktop) {
      return 'fas fa-desktop';
    } else if (deployementType === this.DEPLOYMENT_TYPES.mobile) {
      return 'fas fa-mobile-alt';
    } else if (deployementType === this.DEPLOYMENT_TYPES.server) {
      return 'fas fa-server';
    } else {
      return 'fas fa-keyboard';
    }
  }

  public getYesNoValue(value: string): string {
    if(value === 'T') {
      return 'Yes';
    } else if(value === 'F') {
      return 'No';
    } else {
      return 'N/A';
    }
  }

  public renderAppBundleList(appBundle: AppBundle[]): string {
    let list = 'None';
    if(appBundle && appBundle.length > 0) {
      list = '<ul>';
      appBundle.forEach(a => {
        list += `<li>${a}</li>`;
      });
      list += '</ul>';
    }
    return list;
  }

  public isFieldPopulated(field: any) {
    return (field && field !== '' && field !== 'N/A' && field !== null && field !== 'null') || this.showAllFields;
  }

  public toggleShowAllFields(): void {
    this.showAllFields = !this.showAllFields;
  }

  public getShowAllFieldsButtonText(): string {
    if(this.showAllFields) {
      return 'Hide Empty Fields';
    } else {
      return 'Show All Fields';
    }
  }

  public getTooltip (name: string): string {
    const def = this.attrDefinitions.find(def => def.Term === name);
    if(def){
      return def.TermDefinition;
    }
    return '';
  }

  public isApproved() {
    return this.detailsData.Status === this.STATUS_STATES.approved;
  }

}
