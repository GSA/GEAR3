import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FISMA } from '@api/models/fisma.model';
import { ApiService } from '@services/apis/api.service';
import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';

@Component({
    selector: 'fisma-pocs-details',
    templateUrl: './fisma-pocs-details.component.html',
    styleUrls: ['./fisma-pocs-details.component.scss'],
    standalone: false
})
export class FismaPocsDetailsComponent implements OnInit {

  public fismaId: number = null;
  public detailsData: FISMA;
  public isDataReady: boolean = false;
  public showAllFields: boolean = false;
  public isOverviewTabActive: boolean = true;
  public isPocTabActive: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private sharedService: SharedService,
    private tableService: TableService
  ) {
  }

  public ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.fismaId = +params.get('fismaID');

      // Get FISMA system details
      this.apiService.getOneFISMASys(this.fismaId).subscribe((data: any[]) => {
        this.detailsData = data[0];
        this.isDataReady = true;
      });
    });
  }

  public getStatusClass(status: string): string {
    if (status === 'Active') {
      return 'status-green';
    } else if (status === 'Inactive') {
      return 'status-red';
    } else {
      return 'status-yellow';
    }
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

  public onTabClick(tabName: string, event: Event): void {
    event.preventDefault();
    switch (tabName) {
      case 'overview':
        this.isOverviewTabActive = true;
        this.isPocTabActive = false;
        break;
      case 'poc':
        this.isOverviewTabActive = false;
        this.isPocTabActive = true;
        break;
      default:
        break;
    }
  }

  public pocFormatter(value: string): string {
    if (!value || value === '') {
      return 'None Provided';
    }

    // remove beginning field type from poc info
    let pocsCleanedUp = value.split(':');
    // split poc groupings into array
    let pocs: string[] = pocsCleanedUp[1] ? pocsCleanedUp[1].split(';') : [];
    // the final string that gets displayed
    let finalDisplayStr = '';

    // if there's no pocs display a default
    if(pocs.length === 0 || pocs[0] === "") {
      return 'None Provided';
    }

    // iterate over all poc groupings
    pocs.map(p => {
      if(p !== " ") {
        // split the poc group into specific contact types
        let contactTypes = p.split(',');
        let name = contactTypes[0];
        let email = contactTypes[1];
        let phone = contactTypes[2];

        // temp display string
        let displayStr = '';

        if(name) {
          displayStr += `${name}<br/>`;
        }

        if(email) {
          displayStr += `<a href="https://mail.google.com/mail/?view=cm&fs=1&to=${email}"
          target="_blank" rel="noopener">${email}</a><br/>`;
        }

        if(phone) {
          displayStr += `${phone.substring(0, 4)}-${phone.substring(4, 7)}-${phone.substring(7, 11)}<br/>`;
        }

        // append the temp display string to the final display string
        finalDisplayStr += `${displayStr}<br/>`;
      }
    });

    return finalDisplayStr;
  }
}