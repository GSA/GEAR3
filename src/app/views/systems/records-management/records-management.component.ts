import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { ApiService } from '@services/apis/api.service';
import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';
import { Title } from '@angular/platform-browser';

import { trigger, state, style, animate, transition } from '@angular/animations';

import { Column } from '../../../common/table-classes';
import { Record } from '@api/models/records.model';

@Component({
  selector: 'records-management',
  templateUrl: './records-management.component.html',
  styleUrls: ['./records-management.component.css'],
  animations: [
    trigger('loadingAnimation', [
      state('true', style({ opacity: 1 })),
      state('false', style({ opacity: 0 })),
      transition('true <=> false', animate('500ms ease-in-out')),
    ]),
  ],
})
export class RecordsManagementComponent implements OnInit {
  updateAllInfoData: any = "";

  isLoading: boolean = false;
  isDone: boolean = false;
  isError: boolean = false;
  
  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    public sharedService: SharedService,
    private tableService: TableService,
    private titleService: Title
  ) {}

  tableData: Record[] = [];
  tableDataOriginal: Record[] = [];

  tableCols: Column[] = [
    {
      field: 'GSA_Number',
      header: 'GSA Number',
      isSortable: true,
    },
    {
      field: 'Record_Item_Title',
      header: 'Record Title',
      isSortable: true,
    },
    {
      field: 'Description',
      header: 'Description',
      isSortable: false,
      showColumn: true,
      formatter: this.sharedService.formatDescription
    },
    {
      field: 'Record_Status',
      header: 'Status',
      showColumn: false,
      isSortable: true,
    },
    {
      field: 'RG',
      header: 'Record Group',
      showColumn: false,
      isSortable: true,
    },
    {
      field: 'Retention_Instructions',
      header: 'Retention Instructions',
      isSortable: false,
      showColumn: false,
      class: 'text-truncate',
    },
    {
      field: 'Legal_Disposition_Authority',
      header: 'Disposition Authority (DA)',
      isSortable: true,
    },
    {
      field: 'Type_Disposition',
      header: 'Disposition Type',
      showColumn: false,
      isSortable: true,
    },
    {
      field: 'Date_DA_Approved',
      header: 'DA Approval Date',
      showColumn: false,
      isSortable: true,
    },
    {
      field: 'Disposition_Notes',
      header: 'Disposition Notes',
      isSortable: false,
      showColumn: false,
      class: 'text-truncate',
    },
    {
      field: 'FP_Category',
      header: 'FP Category',
      showColumn: false,
      isSortable: true,
    },
    {
      field: 'PII',
      header: 'PII',
      isSortable: true,
    },
    {
      field: 'CUI',
      header: 'CUI',
      isSortable: true,
    },
    {
      field: 'FY_Retention_Years',
      header: 'Retention Years',
      isSortable: true,
    },
  ];

  ngOnInit(): void {
    // Set JWT when logged into GEAR Manager when returning from secureAuth
    this.sharedService.setJWTonLogIn();

    this.apiService.getRecords().subscribe(r => {
      this.tableService.updateReportTableData(r);
      this.tableData = r;
      this.tableDataOriginal = r;
    });

    // Method to open details modal when referenced directly via URL
    this.route.params.subscribe((params) => {
      var detailrecID = params['recID'];
      if (detailrecID) {
        this.titleService.setTitle(
          `${this.titleService.getTitle()} - ${detailrecID}`
        );
        this.apiService.getOneRecord(detailrecID).subscribe((data: any[]) => {
          this.tableService.recordsTableClick(data[0]);
        });
      }
    });
  }

  runUpdateAllRecordSys(){
    console.log("Starting update all record system data...")
    let data: any = ""

    // log execute to database
    this.apiService.logEvent({type: 'log', message: 'Update All Related Records - Executed Manually', user: this.sharedService.authUser}).toPromise()
    .then((data: any[]) => {
      console.log(data);
    });

    // Display loading animation
    this.isLoading = true;
    // Reset Process Done
    this.isDone = false;
    // Reset the error
    this.isError = false;

    try {
      // call api to update all record system data
      this.apiService.updateAllRecordSys(data).toPromise()
      .then((data: any[]) => {
        let dataError = data["error"];
        let dataMessage = data["message"];
        console.log("dataError: " + dataError + " dataMessage: " + dataMessage);
        console.log(JSON.stringify(data));

        // Check if an error was returned
        if ((dataError !== null && dataError !== undefined) || (dataMessage !== null && dataMessage !== undefined)) {  
          console.log("-- api returned error --");

          // log error to database
          this.apiService.logEvent({type: 'error', message: 'Update All Related Records - Rejected with ' + dataError, user: this.sharedService.authUser}).toPromise()
          .then((data: any[]) => {
            console.log(data);
          });

          // Hide loading animation when error
          this.isLoading = false;
          // Set Process Done on error
          this.isDone = true;
          // Set error true
          this.isError = true;
        } else {
          console.log("-- all good --");
          
          // Set data
          this.updateAllInfoData = data;
          // Hide loading animation
          this.isLoading = false;
          // Set Process Done
          this.isDone = true;
          // Set error false
          this.isError = false;
          
          console.log("Finished update all record system data.");
        }
      })
      .catch((error) => {
        console.log("updateAllRecordSys returned and caught an error.");
        //console.log(error);

        // log error to database
        this.apiService.logEvent({type: 'error', message: 'Update All Related Records - Rejected with ' + JSON.stringify(error), user: this.sharedService.authUser}).toPromise()
        .then((data: any[]) => {
          console.log(data);
        });

        // Hide loading animation when error
        this.isLoading = false;
        // Set Process Done on error
        this.isDone = true;
        // Set error true
        this.isError = true;
      })
    } catch (error) {
      console.log("Update All Records System - rejected with " + JSON.stringify(error));
        
      // log error to database
      this.apiService.logEvent({type: 'error', message: 'Update All Related Records - Errored with ' + JSON.stringify(error), user: this.sharedService.authUser}).toPromise()
      .then((data: any[]) => {
        console.log(data);
      });

      // Hide loading animation when error
      this.isLoading = false;
      // Set Process Done on error
      this.isDone = true;
      // Set error true
      this.isError = true;
    }
  }
}
