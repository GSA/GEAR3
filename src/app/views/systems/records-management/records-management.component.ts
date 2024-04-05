import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { ApiService } from '@services/apis/api.service';
import { ModalsService } from '@services/modals/modals.service';
import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';
import { Title } from '@angular/platform-browser';

import { trigger, state, style, animate, transition } from '@angular/animations';

// Declare jQuery symbol
declare var $: any;

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
    private location: Location,
    private modalService: ModalsService,
    private route: ActivatedRoute,
    private router: Router,
    public sharedService: SharedService,
    private tableService: TableService,
    private titleService: Title
  ) {}

  // Records Table Options
  tableOptions: {} = this.tableService.createTableOptions({
    advancedSearch: true,
    idTable: 'RecordsTable',
    classes: 'table-hover table-dark clickable-table',
    showColumns: true,
    showExport: true,
    exportFileName: 'GSA_Record_Schedules',
    exportIgnoreColumn:[2],
    headerStyle: 'bg-danger',
    pagination: true,
    search: true,
    sortName: 'GSA_Number',
    sortOrder: 'asc',
    showToggle: true,
    url: this.apiService.recordsUrl,
  });

  // Apps Table Columns
  columnDefs: any[] = [
    {
      field: 'GSA_Number',
      title: 'GSA Number',
      sortable: true,
    },
    {
      field: 'Record_Item_Title',
      title: 'Record Title',
      sortable: true,
    },
    {
      field: 'Description',
      title: 'Description',
      sortable: false,
      visible: true,
      class: 'text-wrap',
      formatter: (value: any, row: any): string => {
        return value && value.length > 200 ? value.substring(0, 200) + "..." : value;
      }
    },
    {
      field: 'Description',
      title: 'Description',
      sortable: false,
      visible: false,
      switchable: false,
      forceExport: true
    },
    {
      field: 'Record_Status',
      title: 'Status',
      visible: false,
      sortable: true,
    },
    {
      field: 'RG',
      title: 'Record Group',
      visible: false,
      sortable: true,
    },
    {
      field: 'Retention_Instructions',
      title: 'Retention Instructions',
      sortable: false,
      visible: false,
      class: 'text-truncate',
    },
    {
      field: 'Legal_Disposition_Authority',
      title: 'Disposition Authority (DA)',
      sortable: true,
    },
    {
      field: 'Type_Disposition',
      title: 'Disposition Type',
      visible: false,
      sortable: true,
    },
    {
      field: 'Date_DA_Approved',
      title: 'DA Approval Date',
      visible: false,
      sortable: true,
    },
    {
      field: 'Disposition_Notes',
      title: 'Disposition Notes',
      sortable: false,
      visible: false,
      class: 'text-truncate',
    },
    {
      field: 'FP_Category',
      title: 'FP Category',
      visible: false,
      sortable: true,
    },
    {
      field: 'PII',
      title: 'PII',
      sortable: true,
    },
    {
      field: 'CUI',
      title: 'CUI',
      sortable: true,
    },
    {
      field: 'FY_Retention_Years',
      title: 'Retention Years',
      sortable: true,
    },
  ];

  ngOnInit(): void {
    // Enable popovers
    $(function () {
      $('[data-toggle="popover"]').popover();
    });

    // Set JWT when logged into GEAR Manager when returning from secureAuth
    this.sharedService.setJWTonLogIn();

    $('#recordsTable').bootstrapTable(
      $.extend(this.tableOptions, {
        columns: this.columnDefs,
        data: [],
      })
    );

    // Method to handle click events on the Records table
    $(document).ready(
      $('#recordsTable').on(
        'click-row.bs.table',
        function (e, row) {
          this.tableService.recordsTableClick(row);
        }.bind(this)
      )
    );

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
