import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

import { ModalsService } from '@services/modals/modals.service';
import { SharedService } from "@services/shared/shared.service";
import { TableService } from '@services/tables/table.service';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'systems-modal',
  templateUrl: './systems-modal.component.html',
  styleUrls: ['./systems-modal.component.css']
})
export class SystemsModalComponent implements OnInit {

  system = <any>{};

  constructor(
    private location: Location,
    public modalService: ModalsService,
    private router: Router,
    public sharedService: SharedService,
    public tableService: TableService) { }

  // System TIME Table Options
  sysTimeTableOptions: {} = this.tableService.createTableOptions({
    advancedSearch: true,
    idTable: 'sysTimeTable',
    classes: "table-hover table-dark",
    showColumns: true,
    showExport: true,
    exportFileName: null,
    headerStyle: "bg-danger",
    pagination: true,
    search: true,
    sortName: 'FY',
    sortOrder: 'asc',
    showToggle: true,
    url: null
  });

  // System TIME Table Columns
  sysTimecolumnDefs: any[] = [{
    field: 'System Name',
    title: 'System Name',
    sortable: true,
    visible: false
  }, {
    field: 'FY',
    title: 'FY',
    sortable: true
  }, {
    field: 'TIME Designation',
    title: 'TIME Designation',
    sortable: true
  }, {
    field: 'Business Score',
    title: 'Business Score',
    sortable: true
  }, {
    field: 'Technical Score',
    title: 'Technical Score',
    sortable: true
  }, {
    field: 'O&M Cost',
    title: 'O&M Cost',
    sortable: true
  }, {
    field: 'DM&E Cost',
    title: 'DM&E Cost',
    sortable: true
  }, {
    field: 'Software/Hardware License Costs',
    title: 'License Costs',
    sortable: true
  }, {
    field: 'Questionnaire Last Updated',
    title: 'Questionnaire Last Updated',
    sortable: true,
    formatter: this.sharedService.dateFormatter
  }, {
    field: 'POC Last Updated',
    title: 'POC of Last Updated',
    sortable: true,
    formatter: this.sharedService.emailFormatter
  }, {
    field: 'File Link',
    title: 'File Link',
    sortable: true,
    formatter: this.sharedService.linksFormatter
  }];


  // Related Business Capabilities Table Options
  sysCapTableOptions: {} = this.tableService.createTableOptions({
    advancedSearch: true,
    idTable: null,
    classes: "table-hover table-light clickable-table",
    showColumns: false,
    showExport: true,
    exportFileName: null,
    headerStyle: "bg-royal-blue text-white",
    pagination: false,
    search: true,
    sortName: 'ReferenceNum',
    sortOrder: 'asc',
    showToggle: true,
    url: null
  });

  // Related Business Capabiltiies Table Columns
  sysCapColumnDefs: any[] = [{
    field: 'ReferenceNum',
    title: 'Ref Id',
    sortable: true
  }, {
    field: 'Name',
    title: 'Capability Name',
    sortable: true
  }, {
    field: 'Description',
    title: 'Description',
    sortable: true,
    visible: false,
    class: 'text-truncate'
  }, {
    field: 'Level',
    title: 'Level',
    sortable: true
  }, {
    field: 'Parent',
    title: 'Parent',
    sortable: true
  }];


  // Related Technologies Table Options
  sysTechTableOptions: {} = this.tableService.createTableOptions({
    advancedSearch: false,
    idTable: null,
    classes: "table-hover table-light clickable-table",
    showColumns: true,
    showExport: true,
    exportFileName: null,
    headerStyle: "bg-teal text-white",
    pagination: false,
    search: true,
    sortName: 'Name',
    sortOrder: 'asc',
    showToggle: true,
    url: null
  });

  // Related Technologies Table Columns
  sysTechColumnDefs: any[] = [{
    field: 'Name',
    title: 'Technology',
    sortable: true
  }, {
    field: 'Description',
    title: 'Description',
    sortable: true,
    visible: false,
    class: 'text-truncate'
  }, {
    field: 'Status',
    title: 'Status',
    sortable: true
  }, {
    field: 'Category',
    title: 'Software Category',
    sortable: true,
  }, {
    field: 'ApprovalExpirationDate',
    title: 'Approved Status Expiration Date',
    sortable: true,
    formatter: this.sharedService.dateFormatter
  }];


  // Related Records Table Options
  sysRecTableOptions: {} = this.tableService.createTableOptions({
    advancedSearch: false,
    idTable: null,
    classes: "table-hover table-light clickable-table",
    showColumns: true,
    showExport: true,
    exportFileName: null,
    headerStyle: "bg-danger text-white",
    pagination: false,
    search: true,
    sortName: 'RecordTitle',
    sortOrder: 'asc',
    showToggle: true,
    url: null
  });

  // Related Records Table Columns
  sysRecColumnDefs: any[] = [{
    field: 'Record_Item_Title',
    title: 'Record Title',
    sortable: true
  }, {
    field: 'Description',
    title: 'Description',
    sortable: false,
    visible: false,
    class: 'text-truncate'
  }, {
    field: 'Record_Status',
    title: 'Status',
    sortable: true
  }, {
    field: 'RG',
    title: 'Record Group',
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
    sortable: true
  }, {
    field: 'Disposition_Notes',
    title: 'Disposition Notes',
    sortable: false,
    visible: false,
    class: 'text-truncate'
  }, {
    field: 'GSA_Number',
    title: 'GSA Number',
    sortable: true,
    visible: false
  }, {
    field: 'FP_Category',
    title: 'FP Category',
    sortable: true
  }, {
    field: 'PII',
    title: 'PII',
    sortable: true
  }, {
    field: 'CUI',
    title: 'CUI',
    sortable: true
  }];

  ngOnInit(): void {
    this.modalService.currentSys.subscribe(system => this.system = system);

    $('#sysTimeTable').bootstrapTable($.extend(this.sysTimeTableOptions, {
      columns: this.sysTimecolumnDefs,
      data: [],
    }));

    $('#systemCapTable').bootstrapTable($.extend(this.sysCapTableOptions, {
      columns: this.sysCapColumnDefs,
      data: [],
    }));

    $('#systemTechTable').bootstrapTable($.extend(this.sysTechTableOptions, {
      columns: this.sysTechColumnDefs,
      data: [],
    }));

    $('#systemRecTable').bootstrapTable($.extend(this.sysRecTableOptions, {
      columns: this.sysRecColumnDefs,
      data: [],
    }));

    // Method to handle click events on the Related Capabilities table
    $(document).ready(
      $('#systemCapTable').on('click-row.bs.table', function (e, row) {
        // Hide First Modal before showing new modal
        $('#systemDetail').modal('hide');

        this.tableService.capsTableClick(row);
      }.bind(this)
    ));

    // Method to handle click events on the Related Technologies table
    $(document).ready(
      $('#systemTechTable').on('click-row.bs.table', function (e, row) {
        // Hide First Modal before showing new modal
        $('#systemDetail').modal('hide');

        this.tableService.itStandTableClick(row);
      }.bind(this)
    ));

    // Method to handle click events on the Related Systems table
    $(document).ready(
      $('#systemRecTable').on('click-row.bs.table', function (e, row) {
        // Hide First Modal before showing new modal
        $('#systemDetail').modal('hide');

        this.tableService.recordsTableClick(row);
      }.bind(this)
      ));

    // $('#subSysTable').bootstrapTable($.extend(this.tableService.relSysTableOptions, {
    //   columns: this.tableService.relSysColumnDefs,
    //   data: [],
    // }));

    // // Method to handle click events on the Sub-Systems table
    // $(document).ready(
    //   $('#subSysTable').on('click-row.bs.table', function (e, row) {
    //     // Hide First Modal before showing new modal
    //     $('#systemDetail').modal('hide');

    //     this.tableService.systemsTableClick(row);
    //   }.bind(this)
    //   ));

    // Revert back to overview tab when modal goes away
    $('#systemDetail').on('hidden.bs.modal', function (e) {
      $("#systemTabs li:first-child a").tab('show');

      // Change URL back without ID after closing Modal
      this.sharedService.removeIDfromURL();
    }.bind(this));
  }

  systemEdit () {
    // Hide Detail Modal before showing Manager Modal
    $('#systemDetail').modal('hide');
    this.modalService.updateDetails(this.system, 'system', false);
    this.sharedService.setSystemForm();
    $('#systemManager').modal('show');
  }

}