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
    visible: false,
    sortable: true
  }, {
    field: 'Technical Score',
    title: 'Technical Score',
    visible: false,
    sortable: true
  }, {
    field: 'O&M Cost',
    title: 'O&M Cost',
    visible: false,
    sortable: true
  }, {
    field: 'DM&E Cost',
    title: 'DM&E Cost',
    visible: false,
    sortable: true
  }, {
    field: 'Software/Hardware License Costs',
    title: 'License Costs',
    visible: false,
    sortable: true
  }, {
    field: 'Questionnaire Last Updated',
    title: 'Questionnaire Last Updated',
    sortable: true,
    visible: false,
    formatter: this.sharedService.dateFormatter
  }, {
    field: 'POC Last Updated',
    title: 'POC of Last Updated',
    sortable: true,
    visible: false,
    formatter: this.sharedService.emailFormatter
  }, {
    field: 'File Link',
    title: 'File Link',
    visible: false,
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


   // Related Investments Table Options
   sysInvestTableOptions: {} = this.tableService.createTableOptions({
    advancedSearch: true,
    idTable: null,
    classes: "table-hover table-dark clickable-table",
    showColumns: true,
    showExport: true,
    exportFileName: null,
    headerStyle: "bg-success",
    pagination: true,
    search: true,
    sortName: 'Name',
    sortOrder: 'asc',
    showToggle: true,
    url: null
  });

  // Related Investments Table Columns
  sysInvestColumnDefs: any[] = [{
    field: 'Name',
    title: 'Investment Name',
    sortable: true
  }, {
    field: 'Description',
    title: 'Description',
    sortable: true,
    visible: false,
    class: 'text-truncate'
  }, {
    field: 'Type',
    title: 'Type',
    sortable: true
  }, {
    field: 'IT_Portfolio',
    title: 'Part of IT Portfolio',
    sortable: true
  }, {
    field: 'Budget_Year',
    title: 'Budget Year',
    sortable: true
  }, {
    field: 'InvManager',
    title: 'Investment Manager',
    sortable: true,
    formatter: this.sharedService.noneProvidedFormatter
  }, {
    field: 'Status',
    title: 'Status',
    sortable: true
  }, {
    field: 'Start_Year',
    title: 'Start Year',
    sortable: true,
    visible: false
  }, {
    field: 'End_Year',
    title: 'End Year',
    sortable: true,
    visible: false
  }, {
    field: 'PSA',
    title: 'Primary Service Area',
    sortable: true,
    visible: false
  }, {
    field: 'Cloud_Alt',
    title: 'Cloud Alt. Evaluation',
    sortable: true,
    visible: false
  }, {
    field: 'Comments',
    title: 'Comments',
    sortable: true,
    visible: false
  }, {
    field: 'UII',
    title: 'Investment UII',
    sortable: true,
    visible: false
  }, {
    field: 'Updated_Date',
    title: 'Updated Date',
    sortable: true,
    visible: false,
    formatter: this.sharedService.dateFormatter
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
    field: 'AttestationRequired',
    title: 'Attestation Required',
    sortable: true,
  }, {
    field: 'AttestationLink',
    title: 'Attestation Link',
    sortable: true,
  }, {
    field: 'Fedramp',
    title: 'Fedramp',
    sortable: true,
  }, {
    field: 'OpenSource',
    title: 'Open Source',
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
    sortName: 'GSA_Number',
    sortOrder: 'asc',
    showToggle: true,
    url: null
  });

  // Related Records Table Columns
  sysRecColumnDefs: any[] = [{
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
    visible: false,
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
    class: 'text-wrap'
  }, {
    field: 'Legal_Disposition_Authority',
    title: 'Disposition Authority (DA)',
    sortable: true
  }, {
    field: 'Type_Disposition',
    title: 'Disposition Type',
    visible: false,
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
    class: 'text-wrap'
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
    title: 'Retention Years',
    visible: false,
    sortable: true
  }];

//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!START WEBSITES
// Related Websites Table Options
sysWebsitesTableOptions: {} = this.tableService.createTableOptions({
  advancedSearch: false,
  idTable: null,
  classes: "table-hover table-light clickable-table",
  showColumns: true,
  showExport: true,
  exportFileName: null,
  headerStyle: "bg-danger text-white",
  pagination: false,
  search: true,
  sortName: 'domain',
  sortOrder: 'asc',
  showToggle: true,
  url: null
});

// Related Websites Table Columns
sysWebsitesColumnDefs: any[] = [
  {
    field: 'domain',
    title: 'Domain',
    sortable: true,
  },
  {
    field: 'office',
    title: 'Office',
    sortable: true,
  },
  {
    field: 'site_owner_email',
    title: 'Site Owner',
    sortable: true,
  },
  {
    field: 'contact_email',
    title: 'Contact Email',
    sortable: true,
  },
  {
    field: 'production_status',
    title: 'Status',
    sortable: true,
  },
  {
    field: 'redirects_to',
    title: 'Redirect URL',
    sortable: true,
  },
  {
    field: 'required_by_law_or_policy',
    title: 'Required?',
    sortable: true,
  },
  {
    field: 'has_dap',
    title: 'Uses DAP?',
    sortable: true,
  },
  {
    field: 'mobile_friendly',
    title: 'Mobile Friendly?',
    sortable: true,
  },
  {
    field: 'has_search',
    title: 'Has Search?',
    sortable: true,
  },
  {
    field: 'repository_url',
    title: 'Repository URL',
    sortable: true,
  },
  {
    field: 'hosting_platform',
    title: 'Hosting Platform',
    sortable: true,
  },
  {
    field: 'cms_platform',
    title: 'Content Management Platform',
    sortable: true,
  },
  {
    field: 'https',
    title: 'HTTPS?',
    sortable: true,
  },
  {
    field: 'sub_office',
    title: 'Sub-office',
    sortable: false,
    visible: false,
    class: 'text-truncate',
  },
  {
    field: 'type_of_site',
    title: 'Type of Site',
    sortable: true,
    visible: true,
    class: 'text-truncate',
  },
];

//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!END WEBSITES



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

    $('#systemInvestTable').bootstrapTable($.extend(this.sysInvestTableOptions, {
      columns: this.sysInvestColumnDefs,
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

    $('#systemWebsitesTable').bootstrapTable($.extend(this.sysWebsitesTableOptions, {
      columns: this.sysWebsitesColumnDefs,
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
      $('#systemInvestTable').on('click-row.bs.table', function (e, row) {
        // Hide First Modal before showing new modal
        $('#systemDetail').modal('hide');

        this.tableService.investTableClick(row);
      }.bind(this)
      ));

    // Method to handle click events on the Related Records table
    $(document).ready(
      $('#systemRecTable').on('click-row.bs.table', function (e, row) {
        // Hide First Modal before showing new modal
        $('#systemDetail').modal('hide');

        this.tableService.recordsTableClick(row);
      }.bind(this)
      ));

    // Method to handle click events on the Related Websites table
    $(document).ready(
      $('#systemWebsitesTable').on('click-row.bs.table', function (e, row) {
        // Hide First Modal before showing new modal
        $('#systemDetail').modal('hide');

        this.tableService.websitesTableClick(row);
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
