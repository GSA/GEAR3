import { Component, OnInit } from '@angular/core';
import { formatDate } from '@angular/common';
import { Location } from '@angular/common';

import { ModalsService } from '../../services/modals/modals.service';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'organizations',
  templateUrl: './organizations.component.html',
  styleUrls: ['./organizations.component.css']
})
export class OrganizationsComponent implements OnInit {

  row: Object = <any>{};

  constructor(private location: Location,
    private modalService: ModalsService) {
    this.modalService.currentInvest.subscribe(row => this.row = row);
  }

  // Organizations Table Options
  tableOptions: {} = {
    advancedSearch: true,
    idTable: 'advSearchOrgTable',
    buttonsClass: 'info',
    cache: true,
    classes: "table table-bordered table-striped table-hover table-dark",
    showColumns: false,
    showExport: true,
    exportDataType: 'all',
    exportOptions: {
      fileName: function () {
        // Append current date time to filename
        this.currentDate = formatDate(Date.now(), 'MMM_dd_yyyy-HH_mm', 'en-US');
        return 'GSA_Business_Capabilities-' + this.currentDate
      }
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
      sortable: true
    }];

  ngOnInit(): void {
    $('#orgTable').bootstrapTable($.extend(this.tableOptions, {
      columns: this.columnDefs,
      data: [],
    }));

    // Method to handle click events on the organization table
    $(document).ready(
      $('#orgTable').on('click-row.bs.table', function (e, row) {
        // console.log("Organization Table Clicked Row: ", row);  // Debug

        this.modalService.updateDetails(row, 'organization');
        $('#organizationDetail').modal('show');

        // Update related apps table in detail modal with clicked organization
        $('#orgAppsTable').bootstrapTable('refreshOptions', {
          exportOptions: {
            fileName: function () {
              // Append current date time to filename
              this.currentDate = formatDate(Date.now(), 'MMM_dd_yyyy-HH_mm', 'en-US');
              return row.Name + '-Organizational_Apps-' + this.currentDate
            }
          },
          url: this.location.prepareExternalUrl('/api/organizations/' 
            + String(row.ID) + '/applications')
        })

      }.bind(this)
    ));

  }

}
