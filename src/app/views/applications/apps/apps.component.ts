import { Component, OnInit } from '@angular/core';

import { ApiService } from "../../../services/apis/api.service";
import { ModalsService } from '../../../services/modals/modals.service';
import { SharedService } from '../../../services/shared/shared.service';
import { TableService } from '../../../services/tables/table.service';

import { Application } from 'api/models/applications.model';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'apps',
  templateUrl: './apps.component.html',
  styleUrls: ['./apps.component.css']
})
export class AppsComponent implements OnInit {

  row: Object = <any>{};
  filteredTable: boolean = false;
  interfaces: any[] = [];

  constructor(
    private apiService: ApiService,
    private modalService: ModalsService,
    public sharedService: SharedService,
    private tableService: TableService) {
    this.modalService.currentSys.subscribe(row => this.row = row);
  }

  // Apps Table Options
  tableOptions: {} = this.tableService.createTableOptions({
    advancedSearch: true,
    idTable: 'AppsTable',
    classes: "table-hover table-dark clickable-table",
    showColumns: true,
    showExport: true,
    exportFileName: 'GSA_Business_Apps',
    headerStyle: "bg-danger",
    pagination: true,
    search: true,
    sortName: 'Name',
    sortOrder: 'asc',
    showToggle: true,
    url: this.sharedService.internalURLFmt('/api/applications')
  });

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
    sortable: true,
    formatter: this.sharedService.descFormatter
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
    title: 'Owning Org (Short)',
    sortable: true
  }, {
    field: 'Owner',
    title: 'Owning Org (Long)',
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
    formatter: this.sharedService.systemFormatter
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
    field: 'Mobile_App_Indicator',
    title: 'Mobile App?',
    sortable: true,
    visible: false
  },
  // {
  //   field: 'Desktop_Indicator',
  //   title: 'Desktop Indicator',
  //   sortable: true,
  //   visible: false
  // },
  {
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
    formatter: this.sharedService.systemFormatter
  },
  //{
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
  }, {
    field: 'Application_or_Website',
    title: 'Application or Website',
    sortable: true,
    visible: false
  }, {
    field: 'Application_Notes',
    title: 'Application Notes',
    sortable: false,
    visible: false
  }];

  // Retired Apps Table Column Definitions
  retiredColumnDefs: any[] = [{
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
    sortable: true,
    formatter: this.sharedService.descFormatter
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
    title: 'Owning Org (Short)',
    sortable: true
  }, {
    field: 'Owner',
    title: 'Owning Org (Long)',
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
    visible: false,
    formatter: this.sharedService.systemFormatter
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
    field: 'Mobile_App_Indicator',
    title: 'Mobile App?',
    sortable: true,
    visible: false
  },
  // {
  //   field: 'Desktop_Indicator',
  //   title: 'Desktop Indicator',
  //   sortable: true,
  //   visible: false
  // },
  {
    field: 'Status',
    title: 'Status',
    sortable: true
  }, {
    field: 'ProdYear',
    title: 'Production Year',
    sortable: true
  }, {
    field: 'RetiredYear',
    title: 'Retired Year (CY)',
    sortable: true
  }, {
    field: 'FISMASystem',
    title: 'FISMA System',
    sortable: true,
    visible: false,
    formatter: this.sharedService.systemFormatter
  },
  //{
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
  }, {
    field: 'Application_or_Website',
    title: 'Application or Website',
    sortable: true,
    visible: false
  }, {
    field: 'Application_Notes',
    title: 'Application Notes',
    sortable: false,
    visible: false
  }];


  ngOnInit(): void {
    // Enable popovers
    $(function () {
      $('[data-toggle="popover"]').popover()
    })

    $('#appsTable').bootstrapTable($.extend(this.tableOptions, {
      columns: this.columnDefs,
      data: [],
    }));

    // Filter by only non-retired
    $(document).ready(
      $('#appsTable').bootstrapTable('filterBy', {
        Status: ['Candidate', 'Pre-Production', 'Production']
      })
    );

    // Method to handle click events on the Applications table
    $(document).ready(
      $('#appsTable').on('click-row.bs.table', function (e, row) {
        this.tableService.appsTableClick(row);
        this.getInterfaceData(row.ID);
      }.bind(this),
      ));

  }


  // Create new application when in GEAR Manager mode
  createApp() {
    var emptyApp = new Application();

    // By default, set new record to active
    emptyApp.Status = 'Pre-Production';
    this.modalService.updateRecordCreation(true);
    this.modalService.updateDetails(emptyApp, 'application');
    this.sharedService.setAppForm();
    $('#appManager').modal('show');
  }

  // Update table, filtering by SSO
  changeFilter(field: string, term: string) {
    this.filteredTable = true;  // SSO filters are on, expose main table button
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
        url: this.sharedService.internalURLFmt('/api/applications/applications_retired')
      });

    } else {
      $('#appsTable').bootstrapTable('filterBy', filter);
    }
  }

  backToMainApp() {
    this.filteredTable = false;  // Hide main button

    // Remove filters and back to default
    $('#appsTable').bootstrapTable('filterBy', { Status: ['Candidate', 'Pre-Production', 'Production'] });
    $('#appsTable').bootstrapTable('refreshOptions', {
      columns: this.columnDefs,
      url: this.sharedService.internalURLFmt('/api/applications')
    });
  }

  private getInterfaceData(appID: number) {
    this.apiService.getAppInterfaces(appID).subscribe((data: any[]) => {
      this.interfaces = data;
      this.createInterfaceChart(appID, this.interfaces);
    });
  }

  private createInterfaceChart(appID: number, interfaces: any[]) {
    // console.log(appID, interfaces);
    var CONTAINER_ID = 'interfaceChart',
      SVG_ID = 'interfaceSVG';

    interfaces.forEach(inter => {
      if (inter.System1 == null) inter.System1 = 'None';
      if (inter.System2 == null) inter.System2 = 'None';
    });

  }

}
