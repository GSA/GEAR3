import { Component, OnInit } from '@angular/core';

import { ModalsService } from '../../../services/modals/modals.service';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'investments-modal',
  templateUrl: './investments-modal.component.html',
  styleUrls: ['./investments-modal.component.css']
})
export class InvestmentsModalComponent implements OnInit {

  investment = <any>{};

  constructor(private modalService: ModalsService) { }

  // Related Apps Table Options
  tableOptions: {} = {
    advancedSearch: true,
    idTable: 'advSearchInvestRelAppsTable',
    buttonsClass: 'info',
    cache: true,
    classes: "table table-bordered table-striped table-hover table-dark",
    showColumns: true,
    showExport: true,
    exportDataType: 'all',
    exportTypes: ['xlsx', 'pdf', 'csv', 'json', 'xml', 'txt', 'sql'],
    pagination: true,
    showPaginationSwitch: true,
    search: true,
    showSearchClearButton: true,
    searchOnEnterKey: true,
    sortName: 'Name',
    sortOrder: 'asc',
    showToggle: true,
  };

  // Related Apps Table Columns
  columnDefs: any[] = [{
    field: 'Name',
    title: 'Business Application Name',
    sortable: true
  }, {
    field: 'Alias',
    title: 'Alias',
    sortable: true,
    visible: false
  }, {
    field: 'Description',
    title: 'Description',
    sortable: true
  }, {
    field: 'SSOShort',
    title: 'SSO',
    sortable: true
  }, {
    field: 'SSO',
    title: 'SSO (Long)',
    sortable: true,
    visible: false
  }, {
    field: 'Owner',
    title: 'Two Letter Org (Long)',
    sortable: true,
    visible: false
  }, {
    field: 'OwnerShort',
    title: 'Two Letter Org (Short)',
    sortable: true
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
    field: 'ParentSystem',
    title: 'Parent System',
    sortable: true,
    visible: false
  }, {
    field: 'FY14',
    title: 'FY14',
    visible: false
  }, {
    field: 'FY15',
    title: 'FY15',
    visible: false
  }, {
    field: 'FY16',
    title: 'FY16',
    visible: false
  }, {
    field: 'FY17',
    title: 'FY17',
    visible: false
  }, {
    field: 'FY18',
    title: 'FY18',
    visible: false
  }, {
    field: 'FY19',
    title: 'FY19',
    visible: false
  }, {
    field: 'FY20',
    title: 'FY20',
    visible: false
  }, {
    field: 'FY21',
    title: 'FY21',
    visible: false
  }, {
    field: 'Notes',
    title: 'Notes',
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
    field: 'Status',
    title: 'Status',
    sortable: true
  },  {
    field: 'ProdYear',
    title: 'Production Year',
    sortable: true,
    visible: false
  },  {
    field: 'FISMASystem',
    title: 'FISMA System',
    sortable: true,
    visible: false
  }, {
    field: 'OMBUID',
    title: 'Application ID',
    sortable: true,
    visible: false
  }];

  ngOnInit(): void {
    this.modalService.currentInvest.subscribe(investment => this.investment = investment);

    $('#investRelAppsTable').bootstrapTable($.extend(this.tableOptions, {
      columns: this.columnDefs,
      data: [],
    }));

    // Method to handle click events on the Related Apps table
    // $(document).ready(
    //   $('#investRelAppsTable').on('click-row.bs.table', function (e, row) {
    //     console.log("Related Apps Clicked Row: ", row);  // Debug

    //     this.modalService.updateDetails(row);
    //     $('#appDetail').modal('show');

    //   }.bind(this)
    // ));
  }

}
