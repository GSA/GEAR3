import { Injectable } from '@angular/core';

import { ApiService } from "@services/apis/api.service";
import { ModalsService } from '@services/modals/modals.service';
import { SharedService } from '@services/shared/shared.service';

// Declare jQuery symbol
declare var $: any;

interface ClickOptions {
  data: any,
  update: string,
  detailModalID: string,
  appsTableID: string,
  exportName: string,
  apiString: string
};

@Injectable({
  providedIn: 'root'
})
export class TableService {

  // Apps Related Table Options
  public relAppsTableOptions: {} = this.createTableOptions({
    advancedSearch: true,
    idTable: 'RelAppsTable',
    classes: "table-hover table-light clickable-table",
    showColumns: true,
    showExport: true,
    exportFileName: null,
    headerStyle: "bg-danger text-white",
    pagination: true,
    search: true,
    sortName: 'Name',
    sortOrder: 'asc',
    showToggle: true,
    url: null
  });

  // Apps Related Table Columns
  public relAppsColumnDefs: any[] = [{
    field: 'Name',
    title: 'Business Application Name',
    sortable: true
  }, {
    field: 'DisplayName',
    title: 'Display Name',
    sortable: true,
    visible: false
  }, {
    field: 'Description',
    title: 'Description',
    sortable: true,
    class: 'text-truncate'
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
    title: 'Owning Org (Long)',
    sortable: true,
    visible: false
  }, {
    field: 'OwnerShort',
    title: 'Owning Org (Short)',
    sortable: true
  }, {
    field: 'Support',
    title: 'Supporting Org (Long)',
    sortable: true,
    visible: false
  }, {
    field: 'SupportShort',
    title: 'Supportingr Org (Short)',
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


  public createTableOptions(definitions: any): {} {
    return {
      advancedSearch: definitions.advancedSearch,
      idTable: 'advSearch' + definitions.idTable,
      buttonsClass: 'info',
      cache: true,
      classes: "table table-bordered table-striped " + definitions.classes,
      showColumns: definitions.showColumns,

      showExport: definitions.showExport,
      exportDataType: 'all',
      exportOptions: {
        fileName: this.sharedService.fileNameFmt(definitions.exportFileName)
      },
      exportTypes: ['xlsx', 'pdf', 'csv', 'json', 'xml', 'txt', 'sql'],

      headerStyle: function (column) { return { classes: definitions.headerStyle } },

      pagination: definitions.pagination,
      showPaginationSwitch: definitions.pagination,

      search: definitions.search,
      showSearchClearButton: definitions.search,
      searchOnEnterKey: definitions.search,

      sortName: definitions.sortName,
      sortOrder: definitions.sortOrder,
      showToggle: definitions.showToggle,
      url: definitions.url
    };
  };


  public globalSearchTableClick(searchData: any) {
    // console.log("Global Search Table Clicked Row: ", data);  // Debug

    switch (searchData.GEAR_Type) {
      case 'Application':
        this.apiService.getOneApp(searchData.Id).subscribe((apiData: any[]) => {
          this.appsTableClick(apiData[0]);
        });
        break;

      case 'Capability':
        this.apiService.getOneCap(searchData.Id).subscribe((apiData: any[]) => {
          this.capsTableClick(apiData[0]);
        });
        break;

      case 'FISMA':
        this.apiService.getOneFISMASys(searchData.Id).subscribe((apiData: any[]) => {
          this.fismaTableClick(apiData[0]);
        });
        break;

      case 'Investment':
        this.apiService.getOneInvest(searchData.Id).subscribe((apiData: any[]) => {
          this.investTableClick(apiData[0]);
        });
        break;

      case 'System':
        this.apiService.getOneSys(searchData.Id).subscribe((apiData: any[]) => {
          this.systemsTableClick(apiData[0]);
        });
        break;

      case 'Technology':
        this.apiService.getOneITStandard(searchData.Id).subscribe((apiData: any[]) => {
          this.itStandTableClick(apiData[0]);
        });
        break;

      default:
        break;
    };
  }


  public appsTableClick(data: any) {
    var options: ClickOptions = {
      data: data,
      update: 'application',
      detailModalID: '#appDetail',
      appsTableID: null,
      exportName: null,
      apiString: null
    };
    this.clickMethod(options);

    // Update TIME report table in detail modal with clicked application
    $('#appTimeTable').bootstrapTable('refreshOptions', {
      exportOptions: {
        fileName: this.sharedService.fileNameFmt(data.Name + '-TIME_Report')
      },
      data: [data]
    });

    // Update related capabilities table in detail modal with clicked application
    this.updateRelatedTable(
      '#appCapTable',
      data.Name + '-Related_Capabilities',
      '/api/applications/get/' + String(data.ID) + '/capabilities'
    );

    // Update related technologies table in detail modal with clicked application
    this.updateRelatedTable(
      '#appTechTable',
      data.Name + '-Related_Technologies',
      '/api/applications/get/' + String(data.ID) + '/technologies'
    );
  }


  public capsTableClick(data: any) {
    var options: ClickOptions = {
      data: data,
      update: 'capability',
      detailModalID: '#capabilityDetail',
      appsTableID: '#capSupportAppsTable',
      exportName: data.Name + '-Supporting_Apps',
      apiString: '/api/capabilities/get/'
    };
    this.clickMethod(options);
  }


  public fismaTableClick(data: any) {
    var options: ClickOptions = {
      data: data,
      update: 'fisma',
      detailModalID: '#fismaDetail',
      appsTableID: '#fismaCertAppsTable',
      exportName: data.Name + '-Certified_Apps',
      apiString: '/api/fisma/get/'
    };
    this.clickMethod(options);
  }


  public investTableClick(data: any) {
    var options: ClickOptions = {
      data: data,
      update: 'investment',
      detailModalID: '#investDetail',
      appsTableID: '#investRelAppsTable',
      exportName: data.Name + '-Related_Apps',
      apiString: '/api/investments/get/'
    };
    this.clickMethod(options);
  }


  public itStandTableClick(data: any) {
    var options: ClickOptions = {
      data: data,
      update: 'it-standard',
      detailModalID: '#itStandardDetail',
      appsTableID: '#itRelAppsTable',
      exportName: data.Name + '-Related_Apps',
      apiString: '/api/it_standards/get/'
    };
    this.clickMethod(options);
  }


  public orgsTableClick(data: any) {
    var options: ClickOptions = {
      data: data,
      update: 'organization',
      detailModalID: '#organizationDetail',
      appsTableID: '#orgAppsTable',
      exportName: data.Name + '-Organizational_Apps',
      apiString: '/api/organizations/get/'
    };
    this.clickMethod(options);
  }


  public systemsTableClick(data: any) {
    var options: ClickOptions = {
      data: data,
      update: 'system',
      detailModalID: '#systemDetail',
      appsTableID: '#childAppsTable',
      exportName: data.Name + '-Child_Apps',
      apiString: '/api/parentsystems/get/'
    };
    this.clickMethod(options);
  }

  private clickMethod(options: ClickOptions) {
    // console.log("Clicked Row Data: ", options.data);  // Debug

    this.modalService.updateDetails(options.data, options.update);
    $(options.detailModalID).modal('show');

    // Update related apps table in detail modal with clicked data
    if (options.appsTableID) {
      this.updateRelatedTable(
        options.appsTableID,
        options.exportName,
        options.apiString + String(options.data.ID) + '/applications'
      );
    };
  }

  private updateRelatedTable(tableID: string, exportName: string, apiString: string) {
    $(tableID).bootstrapTable('refreshOptions', {
      exportOptions: {
        fileName: this.sharedService.fileNameFmt(exportName)
      },
      url: this.sharedService.internalURLFmt(apiString)
    });
  }

}