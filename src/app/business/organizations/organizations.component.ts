import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';

import { ModalsService } from '../../services/modals/modals.service';
import { SharedService } from '../../services/shared/shared.service';
import { TableService } from '../../services/tables/table.service';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'organizations',
  templateUrl: './organizations.component.html',
  styleUrls: ['./organizations.component.css']
})
export class OrganizationsComponent implements OnInit {

  row: Object = <any>{};

  constructor(
    private location: Location,
    private modalService: ModalsService,
    private sharedService: SharedService,
    private tableService: TableService) {
      this.modalService.currentInvest.subscribe(row => this.row = row);
  }

  // Organizations Table Options
  tableOptions: {} = {
    advancedSearch: true,
    idTable: 'advSearchOrgTable',
    buttonsClass: 'info',
    cache: true,
    classes: "table table-bordered table-striped table-hover table-dark clickable-table",
    showColumns: false,
    showExport: true,
    exportDataType: 'all',
    exportOptions: {
      fileName: this.sharedService.fileNameFmt('GSA_Business_Capabilities')
    },
    exportTypes: ['xlsx', 'pdf', 'csv', 'json', 'xml', 'txt', 'sql'],
    pagination: true,
    showPaginationSwitch: true,
    search: true,
    showSearchClearButton: true,
    searchOnEnterKey: true,
    sortName: 'Parent',
    sortOrder: 'asc',
    showToggle: true,
    url: this.location.prepareExternalUrl('/api/organizations')
  };

  // Organizations Table Columns
  columnDefs: any[] = [{
      field: 'Parent',
      title: 'Parent',
      sortable: true
    }, {
      field: 'DisplayName',
      title: 'Short Name',
      sortable: true
    }, {
      field: 'Name',
      title: 'Organization Name',
      sortable: true
    }, {
      field: 'Description',
      title: 'Description',
      sortable: true,
      formatter: this.sharedService.descFormatter
    }];

  ngOnInit(): void {
    $('#orgTable').bootstrapTable($.extend(this.tableOptions, {
      columns: this.columnDefs,
      data: [],
    }));

    // Method to handle click events on the organization table
    $(document).ready(
      $('#orgTable').on('click-row.bs.table', function (e, row) {
        this.tableService.orgsTableClick(row);
      }.bind(this)
    ));

  }

}
