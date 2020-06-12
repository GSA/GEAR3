import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';

import { ModalsService } from '../../services/modals/modals.service';
import { SharedService } from '../../services/shared/shared.service';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'app-apps',
  templateUrl: './apps.component.html',
  styleUrls: ['./apps.component.css']
})
export class AppsComponent implements OnInit {

  row: Object = <any>{};
  ssoTable: boolean = false;

  constructor(
    private location: Location,
    private sharedService: SharedService,
    private modalService: ModalsService) {
      this.modalService.currentSys.subscribe(row => this.row = row);
  }

  // Apps Table Options
  tableOptions: {} = {
    advancedSearch: true,
    idTable: 'advSearchAppsTable',
    buttonsClass: 'info',
    cache: true,
    classes: "table table-bordered table-striped table-hover table-dark",
    showColumns: true,
    showExport: true,
    exportDataType: 'all',
    exportOptions: {
      fileName: this.sharedService.fileNameFmt('GSA_Business_Apps')
    },
    exportTypes: ['xlsx', 'pdf', 'csv', 'json', 'xml', 'txt', 'sql'],
    pagination: true,
    showPaginationSwitch: true,
    search: true,
    showSearchClearButton: true,
    searchOnEnterKey: true,
    sortName: 'Name',
    sortOrder: 'asc',
    showToggle: true,
    url: this.location.prepareExternalUrl('/api/applications')
  };

  // Apps Table Columns
  columnDefs: any[] = [{
    field: 'DisplayName',
    title: 'Display Name',
    sortable: true
  }, {
    field: 'Name',
    title: 'Application Name',
    sortable: true
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
    field: 'CUI',
    title: 'CUI',
    sortable: true,
    visible: false
  }, {
    field: 'OwnerShort',
    title: 'Two Letter Org (Short)',
    sortable: true
  }, {
    field: 'Owner',
    title: 'Two Letter Org (Long)',
    sortable: true,
    visible: false
  }, {
    field: 'BusPOC',
    title: 'Business POC',
    sortable: true,
    visible: false
  }, {
    field: 'BusOrg',
    title: 'Business POC Org',
    sortable: true,
    visible: false
  }, {
    field: 'TechPOC',
    title: 'Technical POC',
    sortable: true,
    visible: false
  }, {
    field: 'TechOrg',
    title: 'Technical POC Org',
    sortable: true,
    visible: false
  }, {
    field: 'System',
    title: 'Parent System',
    sortable: true,
    formatter: this.systemFormatter
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
  }, {
    field: 'ProdYear',
    title: 'Production Year',
    sortable: true,
    visible: false
  }, {
    field: 'FISMASystem',
    title: 'FISMA System',
    sortable: true,
    visible: false,
    formatter: this.systemFormatter
  }, //{
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

  // Retired Apps Table Column Definitions
  retiredColumnDefs: any[] = [{
    field: 'Name',
    title: 'Application Name',
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
    field: 'SSO',
    title: 'SSO',
    sortable: true
  }, {
    field: 'CUI',
    title: 'CUI',
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
    sortable: true,
    visible: false
  }, {
    field: 'BusinessPOC',
    title: 'Business POC',
    sortable: true,
    visible: false
  }, {
    field: 'TechnicalPOC',
    title: 'Technical POC',
    sortable: true,
    visible: false
  }, {
    field: 'System',
    title: 'Parent System',
    sortable: true,
    formatter: this.systemFormatter
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
  }, {
    field: 'ProdYear',
    title: 'Production Year',
    sortable: true,
    visible: false
  }, {
    field: 'FismaSystem',
    title: 'FISMA System',
    sortable: true,
    visible: false,
    formatter: this.systemFormatter
  }, {
    field: 'RetiredYear',
    title: 'Retired Year (CY)',
    sortable: true
  }, {
    field: 'OMBUID',
    title: 'Application ID',
    sortable: true,
    visible: false
  }, {
    field: 'Replacedby',
    title: 'Application Replaced By',
    sortable: true,
    visible: false
  }];


  ngOnInit(): void {
    $('#appsTable').bootstrapTable($.extend(this.tableOptions, {
      columns: this.columnDefs,
      data: [],
    }));

    // Method to handle click events on the Applications table
    $(document).ready(
      $('#appsTable').on('click-row.bs.table', function (e, row) {
        // console.log("Applications Table Clicked Row: ", row);  // Debug

        this.modalService.updateDetails(row, 'application');
        $('#appsDetail').modal('show');

        // Update TIME report table in detail modal with clicked application
        $('#appTimeTable').bootstrapTable('refreshOptions', {
          exportOptions: {
            fileName: this.sharedService.fileNameFmt(row.Name + '-TIME_Report')
          },
          data: [row]
        });

        // Update related capabilities table in detail modal with clicked application
        $('#appCapTable').bootstrapTable('refreshOptions', {
          exportOptions: {
            fileName: this.sharedService.fileNameFmt(row.Name + '-Related_Capabilities')
          },
          url: this.location.prepareExternalUrl('/api/applications/'
           + String(row.ID) + '/capabilities')
        });

        // Update related technologies table in detail modal with clicked application
        $('#appTechTable').bootstrapTable('refreshOptions', {
          exportOptions: {
            fileName: this.sharedService.fileNameFmt(row.Name + '-Related_Technologies')
          },
          url: this.location.prepareExternalUrl('/api/applications/'
           + String(row.ID) + '/technologies')
        });
      }.bind(this),
    ));

  }

  // Data Formatters
  private systemFormatter(value, row, index, field) {
    var finalVal = value;

    if (value == '' || value == undefined) {
      finalVal = "N/A";
    }

    return finalVal;
  };

  // Update table, filtering by SSO
  changeFilter(field: string, term: string) {
    this.ssoTable = true;  // SSO filters are on, expose main table button
    var filter = {};
    filter[field] = term;

    // Set cloud field to visible if filtering by cloud enabled
    if (field == 'Cloud') {
      var cloudCols = this.columnDefs;
      for (let index = 0; index < cloudCols.length; index++) {
        const column = cloudCols[index];
        if (column['field'] == 'Cloud') {
          column['visible'] = true;
        }
      }
      $('#appsTable').bootstrapTable('filterBy', filter);
      $('#appsTable').bootstrapTable('refreshOptions', {
        columns: cloudCols
      });

    // Retired Apps Button
    } else if (field == 'Retired') {
      // Remove any filters and grab data from another API
      $('#appsTable').bootstrapTable('filterBy', {});
      $('#appsTable').bootstrapTable('refreshOptions', {
        columns: this.retiredColumnDefs,
        url: this.location.prepareExternalUrl('/api/applications/applications_retired')
      });

    } else {
      $('#appsTable').bootstrapTable('filterBy', filter);
    }
  }

  backToMainApp() {
    this.ssoTable = false;  // Hide main button

    // Remove filters and back to default
    $('#appsTable').bootstrapTable('filterBy', {});
    $('#appsTable').bootstrapTable('refreshOptions', {
      columns: this.columnDefs,
      url: this.location.prepareExternalUrl('/api/applications')
    });
  }

}