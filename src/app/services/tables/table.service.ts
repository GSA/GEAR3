import { Injectable } from '@angular/core';

import { ApiService } from "../apis/api.service";
import { ModalsService } from '../modals/modals.service';
import { SharedService } from '../shared/shared.service';

// Declare jQuery symbol
declare var $: any;

@Injectable({
  providedIn: 'root'
})
export class TableService {

  // Apps Related Table Options
  public relAppsTableOptions: {} = {
    advancedSearch: true,
    idTable: 'advSearchInvestRelAppsTable',
    buttonsClass: 'info',
    cache: true,
    classes: "table table-bordered table-striped table-hover table-light clickable-table",
    showColumns: true,
    showExport: true,
    exportDataType: 'all',
    exportTypes: ['xlsx', 'pdf', 'csv', 'json', 'xml', 'txt', 'sql'],
    headerStyle: function (column) { return { classes: 'bg-danger text-white' } },
    pagination: true,
    showPaginationSwitch: true,
    search: true,
    showSearchClearButton: true,
    searchOnEnterKey: true,
    sortName: 'Name',
    sortOrder: 'asc',
    showToggle: true,
  };

  // Apps Related Table Columns
  public relAppsColumnDefs: any[] = [{
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
    visible: false,
    formatter: this.sharedService.systemFormatter
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
    visible: false,
    formatter: this.sharedService.FYFormatter
  }, {
    field: 'FY21',
    title: 'FY21',
    visible: false,
    formatter: this.sharedService.FYFormatter
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


  constructor(
    private apiService: ApiService,
    private modalService: ModalsService,
    private sharedService: SharedService) { }


  public globalSearchTableClick(data: any) {
    // console.log("Global Search Table Clicked Row: ", data);  // Debug

    switch (data.GEAR_Type) {
      case 'Application':
        this.apiService.getOneApp(data.Id).subscribe((apiData: any[]) => {
          this.appsTableClick(apiData[0]);
        });
        break;

      case 'Capability':
        this.apiService.getOneCap(data.Id).subscribe((apiData: any[]) => {
          this.capsTableClick(apiData[0]);
        });
        break;

      case 'FISMA':
        this.apiService.getOneFISMASys(data.Id).subscribe((apiData: any[]) => {
          this.fismaTableClick(apiData[0]);
        });
        break;

      case 'Investment':
        this.apiService.getOneInvest(data.Id).subscribe((apiData: any[]) => {
          this.investTableClick(apiData[0]);
        });
        break;

      case 'System':
        this.apiService.getOneSys(data.Id).subscribe((apiData: any[]) => {
          this.systemsTableClick(apiData[0]);
        });
        break;

      case 'Technology':
        this.apiService.getOneITStandard(data.Id).subscribe((apiData: any[]) => {
          this.itStandTableClick(apiData[0]);
        });
        break;

      default:
        break;
    }
  }


  public appsTableClick(data: any) {
    // console.log("Applications Table Clicked Row: ", data);  // Debug

    this.modalService.updateDetails(data, 'application');
    $('#appsDetail').modal('show');

    // Update TIME report table in detail modal with clicked application
    $('#appTimeTable').bootstrapTable('refreshOptions', {
      exportOptions: {
        fileName: this.sharedService.fileNameFmt(data.Name + '-TIME_Report')
      },
      data: [data]
    });

    // Update related capabilities table in detail modal with clicked application
    $('#appCapTable').bootstrapTable('refreshOptions', {
      exportOptions: {
        fileName: this.sharedService.fileNameFmt(data.Name + '-Related_Capabilities')
      },
      url: this.sharedService.internalURLFmt('/api/applications/get/'
        + String(data.ID) + '/capabilities')
    });

    // Update related technologies table in detail modal with clicked application
    $('#appTechTable').bootstrapTable('refreshOptions', {
      exportOptions: {
        fileName: this.sharedService.fileNameFmt(data.Name + '-Related_Technologies')
      },
      url: this.sharedService.internalURLFmt('/api/applications/get/'
        + String(data.ID) + '/technologies')
    });
  }


  public capsTableClick(data: any) {
    // console.log("Capability Table Clicked Row: ", data);  // Debug

    this.modalService.updateDetails(data, 'capability');
    $('#capabilityDetail').modal('show');

    // Update related apps table in detail modal with clicked capabilities
    $('#capSupportAppsTable').bootstrapTable('refreshOptions', {
      exportOptions: {
        fileName: this.sharedService.fileNameFmt(data.Name + '-Supporting_Apps')
      },
      url: this.sharedService.internalURLFmt('/api/capabilities/'
        + String(data.ID) + '/applications')
    })
  }


  public fismaTableClick(data: any) {
    // console.log("FISMA System Table Clicked Row: ", data);  // Debug

    this.modalService.updateDetails(data, 'fisma');
    $('#fismaDetail').modal('show');

    // Update related apps table in detail modal with clicked FISMA system
    $('#fismaCertAppsTable').bootstrapTable('refreshOptions', {
      exportOptions: {
        fileName: this.sharedService.fileNameFmt(data.Name + '-Certified_Apps')
      },
      url: this.sharedService.internalURLFmt('/api/fisma/get/'
        + String(data.ID) + '/applications')
    })
  }


  public investTableClick(data: any) {
    // console.log("Investment Table Clicked Row: ", data);  // Debug

    this.modalService.updateDetails(data, 'investment');
    $('#investDetail').modal('show');

    // Update related apps table in detail modal with clicked investment
    $('#investRelAppsTable').bootstrapTable('refreshOptions', {
      exportOptions: {
        fileName: this.sharedService.fileNameFmt(data.Name + '-Related_Apps')
      },
      url: this.sharedService.internalURLFmt('/api/investments/get/'
        + String(data.ID) + '/applications')
    })
  }


  public itStandTableClick(data: any) {
    // console.log("IT Standard Table Clicked Row: ", data);  // Debug

    this.modalService.updateDetails(data, 'it-standard');
    $('#itStandardDetail').modal('show');

    // Update related apps table in detail modal with clicked investment
    $('#itRelAppsTable').bootstrapTable('refreshOptions', {
      exportOptions: {
        fileName: this.sharedService.fileNameFmt(data.Name + '-Related_Apps')
      },
      url: this.sharedService.internalURLFmt('/api/it_standards/get/'
        + String(data.ID) + '/applications')
    })
  }


  public orgsTableClick(data: any) {
    // console.log("Organization Table Clicked Row: ", data);  // Debug

    this.modalService.updateDetails(data, 'organization');
    $('#organizationDetail').modal('show');

    // Update related apps table in detail modal with clicked organization
    $('#orgAppsTable').bootstrapTable('refreshOptions', {
      exportOptions: {
        fileName: this.sharedService.fileNameFmt(data.Name + '-Organizational_Apps')
      },
      url: this.sharedService.internalURLFmt('/api/organizations/'
        + String(data.ID) + '/applications')
    })
  }


  public systemsTableClick(data: any) {
    // console.log("Parent Systems Table Clicked Row: ", data);  // Debug

    this.modalService.updateDetails(data, 'system');
    $('#systemDetail').modal('show');

    // Update related apps table in detail modal with clicked parent system
    $('#childAppsTable').bootstrapTable('refreshOptions', {
      exportOptions: {
        fileName: this.sharedService.fileNameFmt(data.Name + '-Child_Apps')
      },
      url: this.sharedService.internalURLFmt('/api/parentsystems/get/'
        + String(data.ID) + '/applications')
    })
  }

}