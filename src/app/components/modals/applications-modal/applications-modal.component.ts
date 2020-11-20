import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

import { ApiService } from '@services/apis/api.service';
import { ModalsService } from '@services/modals/modals.service';
import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'applications-modal',
  templateUrl: './applications-modal.component.html',
  styleUrls: ['./applications-modal.component.css']
})
export class ApplicationsModalComponent implements OnInit {

  application = <any>{};
  interfaces: any = [];

  constructor(
    private apiService: ApiService,
    private location: Location,
    private modalService: ModalsService,
    private router: Router,
    public sharedService: SharedService,
    private tableService: TableService) { }

  // TIME Report Table Options
  timeTableOptions: {} = this.tableService.createTableOptions({
    advancedSearch: false,
    idTable: null,
    classes: "table-light",
    showColumns: false,
    showExport: true,
    exportFileName: null,
    headerStyle: "bg-danger text-white",
    pagination: false,
    search: false,
    sortName: null,
    sortOrder: null,
    showToggle: false,
    url: null
  });

  // TIME Report Table Columns
  timeColumnDefs: any[] = [{
    field: 'FY14',
    title: 'FY14',
    visible: false,
    formatter: this.sharedService.FYFormatter
  }, {
    field: 'FY15',
    title: 'FY15',
    visible: false,
    formatter: this.sharedService.FYFormatter
  }, {
    field: 'FY16',
    title: 'FY16',
    visible: false,
    formatter: this.sharedService.FYFormatter
  }, {
    field: 'FY17',
    title: 'FY17',
    visible: false,
    formatter: this.sharedService.FYFormatter
  }, {
    field: 'FY18',
    title: 'FY18',
    visible: false,
    formatter: this.sharedService.FYFormatter
  }, {
    field: 'FY19',
    title: 'FY19',
    visible: false,
    formatter: this.sharedService.FYFormatter
  }, {
    field: 'FY20',
    title: 'FY20',
    formatter: this.sharedService.FYFormatter
  }, {
    field: 'FY21',
    title: 'FY21',
    formatter: this.sharedService.FYFormatter
  }, {
    field: 'FY22',
    title: 'FY22',
    formatter: this.sharedService.FYFormatter
  }, {
    field: 'FY23',
    title: 'FY23',
    formatter: this.sharedService.FYFormatter
  }, {
    field: 'FY24',
    title: 'FY24',
    formatter: this.sharedService.FYFormatter
  }, {
    field: 'TIME_Notes',
    title: 'Notes'
  }];


  // Related Capabilities Table Options
  appCapTableOptions: {} = this.tableService.createTableOptions({
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

  // Related Capabilities Table Columns
  appCapColumnDefs: any[] = [{
    field: 'ReferenceNum',
    title: 'Reference Id',
    sortable: true
  }, {
    field: 'Name',
    title: 'Business Capability',
    sortable: true
  }, {
    field: 'Description',
    title: 'Description',
    sortable: true,
    class: 'text-truncate'
  }, {
    field: 'ParentCap',
    title: 'Parent Capability'
  }];


  // Related Technologies Table Options
  appTechTableOptions: {} = this.tableService.createTableOptions({
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
  appTechColumnDefs: any[] = [{
    field: 'Name',
    title: 'Technology',
    sortable: true
  }, {
    field: 'Description',
    title: 'Description',
    sortable: true,
    class: 'text-truncate'
  }, {
    field: 'Status',
    title: 'Status',
    sortable: true
  }, {
    field: 'ProdYear',
    title: 'Production Year',
    sortable: true,
    visible: false
  }, {
    field: 'Category',
    title: 'Software Category',
    sortable: true,
    visible: false
  }, {
    field: 'Expiration',
    title: 'Approved Status Expiration Date',
    sortable: true,
    visible: false
  }];

  ngOnInit(): void {
    this.modalService.currentApp.subscribe(application => this.application = application);
    this.modalService.currentDataFlow.subscribe(dataFlow => this.interfaces = dataFlow);

    $('#appTimeTable').bootstrapTable($.extend(this.timeTableOptions, {
      columns: this.timeColumnDefs,
      data: [],
    }));

    $('#appCapTable').bootstrapTable($.extend(this.appCapTableOptions, {
      columns: this.appCapColumnDefs,
      data: [],
    }));

    $('#appTechTable').bootstrapTable($.extend(this.appTechTableOptions, {
      columns: this.appTechColumnDefs,
      data: [],
    }));


    // Method to handle click events on the Related Capabilities table
    $(document).ready(
      $('#appCapTable').on('click-row.bs.table', function (e, row) {
        // Hide First Modal before showing new modal
        $('#appDetail').modal('hide');

        this.tableService.capsTableClick(row);
      }.bind(this)
      ));

    // Method to handle click events on the Related Technologies table
    $(document).ready(
      $('#appTechTable').on('click-row.bs.table', function (e, row) {
        // Hide First Modal before showing new modal
        $('#appDetail').modal('hide');

        this.tableService.itStandTableClick(row);
      }.bind(this)
      ));

    // Revert back to overview tab when modal goes away
    $('#appDetail').on('hidden.bs.modal', function (e) {
      $("#appTabs li:first-child a").tab('show');
      this.interfaces = [];

      // Change URL back without ID after closing Modal
      var truncatedURL = this.sharedService.coreURL(this.router.url);
      this.location.replaceState(truncatedURL);
    }.bind(this));
  }

  openRelated(ID: number, type: string) {
    $('#appDetail').modal('hide');

    if (type === 'investment') {
      this.apiService.getOneInvest(ID).subscribe((apiData: any[]) => {
        this.tableService.investTableClick(apiData[0]);
      });
    } else if (type === 'parent') {
      this.apiService.getOneSys(ID).subscribe((apiData: any[]) => {
        this.tableService.systemsTableClick(apiData[0]);
      });
    } else if (type === 'org') {
      this.apiService.getOneOrg(ID).subscribe((apiData: any[]) => {
        this.tableService.orgsTableClick(apiData[0]);
      });
    } else if (type === 'fisma') {
      this.apiService.getOneFISMASys(ID).subscribe((apiData: any[]) => {
        this.tableService.fismaTableClick(apiData[0]);
      });
    }
  }

  appEdit() {
    // Hide Detail Modal before showing Manager Modal
    $('#appDetail').modal('hide');
    this.modalService.updateDetails(this.application, 'application');
    this.sharedService.setAppForm();
    $('#appManager').modal('show');
  }

}
