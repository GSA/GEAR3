import { Component, OnInit } from '@angular/core';
import { formatDate } from '@angular/common';
import { Location } from '@angular/common';

import { ModalsService } from '../../services/modals/modals.service';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'capabilities',
  templateUrl: './capabilities.component.html',
  styleUrls: ['./capabilities.component.css']
})
export class CapabilitiesComponent implements OnInit {

  row: Object = <any>{};
  ssoTable: boolean = false;

  constructor(
    private location: Location,
    private modalService: ModalsService) {
    this.modalService.currentInvest.subscribe(row => this.row = row);
  }

  // Capabilities Table Options
  tableOptions: {} = {
    advancedSearch: true,
    idTable: 'advSearchCapTable',
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
    sortName: 'ReferenceNum',
    sortOrder: 'asc',
    showToggle: true,
    url: this.location.prepareExternalUrl('/api/capabilities')
  };

  // Capabilities Table Columns
  capColumnDefs: any[] = [{
    field: 'ReferenceNum',
    title: 'Ref Id',
    sortable: true
  }, {
    field: 'Name',
    title: 'Function Name',
    sortable: true
  }, {
    field: 'Description',
    title: 'Description',
    sortable: true
  }, {
    field: 'Parent',
    title: 'Parent',
    sortable: true
  }];

  // Capabilities by SSO Table Columns
  ssoColumnDefs: any[] = [{
    field: 'ReferenceNum',
    title: 'Ref Id',
    sortable: true
  }, {
    field: 'Name',
    title: 'Function Name',
    sortable: true
  }, {
    field: 'Description',
    title: 'Description',
    sortable: true
  }, {
    field: 'ParentCap',
    title: 'Parent',
    sortable: true
  }, {
    field: 'Organizations',
    title: 'SSO',
    sortable: true
  }, {
    field: 'Applications',
    title: 'Apps',
    sortable: true
  }];

  ngOnInit(): void {
    $('#capTable').bootstrapTable($.extend(this.tableOptions, {
      columns: this.capColumnDefs,
      data: [],
    }));

    // Method to handle click events on the Investments table
    $(document).ready(
      $('#capTable').on('click-row.bs.table', function (e, row) {
        // console.log("Capability Table Clicked Row: ", row);  // Debug

        this.modalService.updateDetails(row, 'capability');
        $('#capabilityDetail').modal('show');

        // Update related apps table in detail modal with clicked investment
        $('#capSupportAppsTable').bootstrapTable('refreshOptions', {
          exportOptions: {
            fileName: function () {
              // Append current date time to filename
              this.currentDate = formatDate(Date.now(), 'MMM_dd_yyyy-HH_mm', 'en-US');
              return row.Name + '-Supporting_Apps-' + this.currentDate
            }
          },
          url: this.location.prepareExternalUrl('/api/capabilities/' 
            + String(row.ID) + '/applications')
        })
      }.bind(this))
    );
  }

  // Update SSO table after SSO button is clicked
  changeCapSSO(sso: string) {
    this.ssoTable = true;  // SSO filters are on, expose main table button

    $('#capTable').bootstrapTable('refreshOptions', {
      columns: this.ssoColumnDefs,
      idTable: 'advSearchCapSSOTable',
      exportOptions: {
        fileName: function () {
          // Append current date time to filename
          this.currentDate = formatDate(Date.now(), 'MMM_dd_yyyy-HH_mm', 'en-US');
          return 'GSA_Business_Capabilities_by_SSO-' + this.currentDate
        }
      },
      url: this.location.prepareExternalUrl('/api/capabilities/sso/' + sso)
    })
  }

  backToMainCap() {
    this.ssoTable = false;  // Hide main button

    $('#capTable').bootstrapTable('refreshOptions', {
      columns: this.capColumnDefs,
      idTable: 'advSearchCapTable',
      exportOptions: {
        fileName: function () {
          // Append current date time to filename
          this.currentDate = formatDate(Date.now(), 'MMM_dd_yyyy-HH_mm', 'en-US');
          return 'GSA_Business_Capabilities-' + this.currentDate
        }
      },
      url: this.location.prepareExternalUrl('/api/capabilities')
    })
  }

}
