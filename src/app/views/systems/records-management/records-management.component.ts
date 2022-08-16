import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { ApiService } from "@services/apis/api.service";
import { ModalsService } from '@services/modals/modals.service';
import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'records-management',
  templateUrl: './records-management.component.html',
  styleUrls: ['./records-management.component.css']
})
export class RecordsManagementComponent implements OnInit {

  constructor(
    private apiService: ApiService,
    private location: Location,
    private modalService: ModalsService,
    private route: ActivatedRoute,
    private router: Router,
    public sharedService: SharedService,
    private tableService: TableService) { }

  // Records Table Options
  tableOptions: {} = this.tableService.createTableOptions({
    advancedSearch: true,
    idTable: 'RecordsTable',
    classes: "table-hover table-dark clickable-table",
    showColumns: true,
    showExport: true,
    exportFileName: 'GSA_Record_Schedules',
    headerStyle: "bg-danger",
    pagination: true,
    search: true,
    sortName: 'GSA_Number',
    sortOrder: 'asc',
    showToggle: true,
    url: this.apiService.recordsUrl
  });

  // Apps Table Columns
  columnDefs: any[] = [{
    field: 'GSA_Number',
    title: 'GSA Number',
    sortable: true
  }, {
    field: 'Record_Item_Title',
    title: 'Record Title',
    sortable: true
  }, {
    field: 'Description',
    title: 'Description',
    sortable: false,
    class: 'text-wrap'
  }, {
    field: 'Record_Status',
    title: 'Status',
	visible: false,
    sortable: true
  }, {
    field: 'RG',
    title: 'Record Group',
	visible: false,
    sortable: true
  }, {
    field: 'Retention_Instructions',
    title: 'Retention Instructions',
    sortable: false,
    visible: false,
    class: 'text-truncate'
  }, {
    field: 'Legal_Disposition_Authority',
    title: 'Disposition Authority (DA)',
    sortable: true
  }, {
    field: 'Type_Disposition',
    title: 'Disposition Type',
    sortable: true
  }, {
    field: 'Date_DA_Approved',
    title: 'DA Approval Date',
	visible: false,
    sortable: true
  }, {
    field: 'Disposition_Notes',
    title: 'Disposition Notes',
    sortable: false,
    visible: false,
    class: 'text-truncate'
  }, {
    field: 'FP_Category',
    title: 'FP Category',
	visible: false,
    sortable: true
  }, {
    field: 'PII',
    title: 'PII',
    sortable: true
  }, {
    field: 'CUI',
    title: 'CUI',
    sortable: true
  }, {
    field: 'FY_Retention_Years',
    title: 'FY Retention Years',
    sortable: true
  }];

  ngOnInit(): void {
    // Enable popovers
    $(function () {
      $('[data-toggle="popover"]').popover()
    })

    // Set JWT when logged into GEAR Manager when returning from secureAuth
    this.sharedService.setJWTonLogIn();

    $('#recordsTable').bootstrapTable($.extend(this.tableOptions, {
      columns: this.columnDefs,
      data: [],
    }));

    // Method to handle click events on the Records table
    $(document).ready(
      $('#recordsTable').on('click-row.bs.table', function (e, row) {
        this.tableService.recordsTableClick(row);
      }.bind(this),
      ));

    // Method to open details modal when referenced directly via URL
    this.route.params.subscribe(params => {
      var detailrecID = params['recID'];
      if (detailrecID) {
        this.apiService.getOneRecord(detailrecID).subscribe((data: any[]) => {
          this.tableService.recordsTableClick(data[0]);
        });
      };
    });
  }

}