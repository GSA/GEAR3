import { Component, OnInit } from '@angular/core';

import { ModalsService } from '../../../services/modals/modals.service';
import { SharedService } from '../../../services/shared/shared.service';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'capabilities-modal',
  templateUrl: './capabilities-modal.component.html',
  styleUrls: ['./capabilities-modal.component.css']
})
export class CapabilitiesModalComponent implements OnInit {

  capability = <any>{};

  constructor(
    private modalService: ModalsService,
    private sharedService: SharedService) { }

  // Supporting Apps Table Options
  tableOptions: {} = {
    advancedSearch: true,
    idTable: 'advSearchCapSupportAppsTable',
    buttonsClass: 'info',
    cache: true,
    classes: "table table-bordered table-striped table-hover table-light",
    showColumns: true,
    showExport: true,
    exportDataType: 'all',
    exportTypes: ['xlsx', 'pdf', 'csv', 'json', 'xml', 'txt', 'sql'],
    headerStyle: function (column) {return {classes: 'bg-dark text-white'}},
    pagination: true,
    showPaginationSwitch: true,
    search: true,
    showSearchClearButton: true,
    searchOnEnterKey: true,
    sortName: 'Name',
    sortOrder: 'asc',
    showToggle: true,
  };

  // Supporting Apps Table Columns
  columnDefs: any[] = [{
    field: 'Name',
    title: 'Business Application Name',
    sortable: true
  }, {
    field: 'SSO',
    title: 'SSO',
    sortable: true,
    visible: false
  }, {
    field: 'SSOShort',
    title: 'SSO (Short)',
    sortable: true,
    visible: false
  }, {
    field: 'OwnerShort',
    title: 'Two Letter Org (Short)',
    sortable: true,
  }, {
    field: 'Owner',
    title: 'Two Letter Org (Long)',
    sortable: true,
    visible: false
  }, {
    field: 'Alias',
    title: 'Alias',
    sortable: true,
    visible: false
  }, {
    field: 'Description',
    title: 'Description',
    sortable: true,
    visible: false
  }, {
    field: 'ParentSystem',
    title: 'Parent System',
    sortable: true,
    visible: false
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
    formatter: this.sharedService.FYFormatter
  }, {
    field: 'FY19',
    title: 'FY19',
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
    field: 'Notes',
    title: 'Notes',
    visible: false
  }, {
    field: 'BusPOC',
    title: 'Business POC',
    sortable: true,
    visible: false
  }, {
    field: 'TechPOC',
    title: 'Technical POC',
    sortable: true,
    visible: false
  }, {
    field: 'HostingProvider',
    title: 'Hosting Provider',
    sortable: true,
    visible: false
  }, {
    field: 'Cloud',
    title: 'Cloud',
    sortable: true,
    visible: false
  }, {
    field: 'FISMASystem',
    title: 'FISMA System',
    sortable: true,
    visible: false
  },
  // {
  //   field: 'HelpDesk',
  //   title: 'Help Desk',
  //   sortable: true,
  //   visible: false
  // },
  {
    field: 'OMBUID',
    title: 'Application ID',
    sortable: true,
    visible: false
  }];

  ngOnInit(): void {
    this.modalService.currentCap.subscribe(capability => this.capability = capability);

    $('#capSupportAppsTable').bootstrapTable($.extend(this.tableOptions, {
      columns: this.columnDefs,
      data: [],
    }));

    // Method to handle click events on the Supported Apps table
    // $(document).ready(
    //   $('#capSupportAppsTable').on('click-row.bs.table', function (e, row) {
    //     console.log("Supporting Apps Clicked Row: ", row);  // Debug

    //     this.modalService.updateDetails(row);
    //     $('#appDetail').modal('show');

    //   }.bind(this)
    // ));
  }

}
