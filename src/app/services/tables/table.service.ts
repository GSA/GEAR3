import { Injectable, Component, ViewEncapsulation } from '@angular/core';
import { Location } from '@angular/common';

import { Globals } from '@common/globals';

import { ApiService } from '@services/apis/api.service';
import { ModalsService } from '@services/modals/modals.service';
import { SharedService } from '@services/shared/shared.service';
import { Service_Category } from '@api/models/service-category.model';
import { AnalyticsService } from '@services/analytics/analytics.service';
import { BehaviorSubject, Observable, of, scheduled, Subscription } from 'rxjs';
import { FilterButton } from '@common/table-classes';
import { Website } from '@api/models/websites.model';

// Declare jQuery symbol
declare var $: any;

interface ClickOptions {
  data: any;
  dataID: string;
  update: string;
  detailModalID: string;
  sysTableID: string;
  exportName: string;
  systemApiStr: string;
  addRoute: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class TableService {
  
  // Active report table data
  private reportTableDataSubject = new BehaviorSubject<any>([]);
  reportTableData$ = this.reportTableDataSubject.asObservable();

  private reportTableDataReadySubject = new BehaviorSubject<boolean>(false);
  reportTableDataReady$ = this.reportTableDataReadySubject.asObservable();

  // Systems Related Table Options
  public relSysTableOptions: {} = this.createTableOptions({
    advancedSearch: true,
    idTable: 'RelSysTable',
    classes: 'table-hover table-light clickable-table',
    showColumns: true,
    showExport: true,
    exportFileName: null,
    headerStyle: 'bg-danger text-white',
    pagination: true,
    search: true,
    sortName: 'Name',
    sortOrder: 'asc',
    showToggle: true,
    url: null,
  });

  // Systems Related Table Columns
  public relSysColumnDefs: any[] = [
    {
      field: 'DisplayName',
      title: 'Alias/Acronym',
      sortable: true,
    },
    {
      field: 'Name',
      title: 'System Name',
      sortable: true,
    },
    {
      field: 'Description',
      title: 'Description',
      sortable: true,
      visible: false,
      class: 'text-truncate',
    },
    {
      field: 'SystemLevel',
      title: 'System Level',
      sortable: true,
    },
    {
      field: 'Status',
      title: 'Status',
      sortable: true,
    },
    {
      field: 'BusOrg',
      title: 'Business Org',
      sortable: true,
    },
    {
      field: 'RespOrg',
      title: 'Responsible Org',
      sortable: true,
    },
    {
      field: 'ParentName',
      title: 'Parent System',
      sortable: true,
      visible: false,
    },
    {
      field: 'CSP',
      title: 'Cloud Server Provider',
      sortable: true,
      visible: false,
    },
    {
      field: 'CloudYN',
      title: 'Cloud Hosted?',
      sortable: true,
      visible: false,
    },
    {
      field: 'AO',
      title: 'Authorizing Official',
      sortable: true,
      visible: false,
      formatter: this.sharedService.pocStringNameFormatter,
    },
    {
      field: 'SO',
      title: 'System Owner',
      sortable: true,
      visible: false,
      formatter: this.sharedService.pocStringNameFormatter,
    },
    {
      field: 'BusPOC',
      title: 'Business POC',
      sortable: true,
      visible: false,
      formatter: this.sharedService.pocStringNameFormatter,
    },
    {
      field: 'TechPOC',
      title: 'Technical POC',
      sortable: true,
      visible: false,
      formatter: this.sharedService.pocStringNameFormatter,
    },
    {
      field: 'DataSteward',
      title: 'Data Steward',
      sortable: true,
      visible: false,
      formatter: this.sharedService.pocStringNameFormatter,
    },
  ];

  constructor(
    private apiService: ApiService,
    private globals: Globals,
    private modalService: ModalsService,
    private sharedService: SharedService,
    private location: Location,
    private analyticsService: AnalyticsService
  ) {}

  public createTableOptions(definitions: any): {} {
    return {
      advancedSearch: definitions.advancedSearch,
      idTable: definitions.idTable,
      buttonsClass: 'info',
      icons: {advancedSearchIcon: "bi-search"},
      formatAdvancedSearch: function () {return "Search on specific columns"},
      formatColumns: function () {return "Add/remove columns"},
      formatPaginationSwitch: function () {return "Show the entire list or show pages"},
      cache: true,
      classes: 'table table-bordered table-striped ' + definitions.classes,
      showColumns: definitions.showColumns,
      showColumnsSearch: definitions.showColumns,
      showExport: definitions.showExport,
      exportDataType: 'all',
      exportOptions: {
        fileName: this.sharedService.fileNameFmt(definitions.exportFileName),
        ignoreColumn: definitions.exportIgnoreColumn ? definitions.exportIgnoreColumn: [],
      },
      exportTypes: ['xlsx', 'pdf', 'csv', 'json', 'xml', 'txt', 'sql'],

      headerStyle: function (column) {
        return { classes: definitions.headerStyle };
      },

      pagination: definitions.pagination,
      showPaginationSwitch: definitions.pagination,

      search: definitions.search,
      searchOnEnterKey: definitions.search,
      showSearchButton: definitions.search,
      visibleSearch: definitions.search,

      sortName: definitions.sortName,
      sortOrder: definitions.sortOrder,
      showToggle: definitions.showToggle,
      url: definitions.url,
    };
  }

  public globalSearchTableClick(searchData: any) {
    //console.log("Global Search Table Clicked Row: ", searchData);  // Debug

    switch (searchData.GEAR_Type) {
      case 'Capability':
        this.apiService.getOneCap(searchData.Id).subscribe((apiData: any) => {
          this.capsTableClick(apiData[0]);
          this.setGlobalSearchModalUrl(searchData.GEAR_Type, searchData.Id);
        });
        break;

      case 'FISMA':
        this.apiService
          .getOneFISMASys(searchData.Id)
          .subscribe((apiData: any[]) => {
            this.fismaTableClick(apiData[0]);
            this.setGlobalSearchModalUrl(searchData.GEAR_Type, searchData.Id);
          });
        break;

      case 'Investment':
        this.apiService
          .getOneInvest(searchData.Id)
          .subscribe((apiData: any) => {
            this.investTableClick(apiData[0]);
            this.setGlobalSearchModalUrl(searchData.GEAR_Type, searchData.Id);
          });
        break;

      case 'System': // TODO: need to change when gear_schema is fully transitioned
        this.apiService.getOneSys(searchData.Id).subscribe((apiData: any) => {
          this.systemsTableClick(apiData[0]);
          this.setGlobalSearchModalUrl(searchData.GEAR_Type, searchData.Id);
        });
        break;

      case 'Technology':
        this.apiService
          .getOneITStandard(searchData.Id)
          .subscribe((apiData: any) => {
            this.itStandTableClick(apiData[0]);
            this.setGlobalSearchModalUrl(searchData.GEAR_Type, searchData.Id);
          });

        break;

      case 'Organization':
          this.apiService
            .getOneOrg(searchData.Id)
            .subscribe((apiData: any) => {
              this.orgsTableClick(apiData[0]);
              this.setGlobalSearchModalUrl(searchData.GEAR_Type, searchData.Id);
            });
          break;
      case 'Website':
          this.apiService
            .getOneWebsite(searchData.Id)
            .subscribe((apiData: any) => {
              this.websitesTableClick(apiData[0]);
              this.setGlobalSearchModalUrl(searchData.GEAR_Type, searchData.Id);
            });
          break;
      default:
        break;
    }
  }

  public capsTableClick(data: any, addRoute: boolean = true) {
    var options: ClickOptions = {
      data: data,
      dataID: 'ID',
      update: 'capability',
      detailModalID: '#capabilityDetail',
      sysTableID: '#capSupportSysTable',
      exportName: data.Name + '-Supporting_Systems',
      systemApiStr: '/api/capabilities/get/',
      addRoute: addRoute,
    };
    this.clickMethod(options);

    // Update related orgs table in detail modal with clicked system
    this.updateRelatedTable(
      '#capRelOrgsTable',
      data.Name + '-Related_Orgs',
      '/api/capabilities/get/' + data.ID + '/orgs'
    );
  }

  public fismaTableClick(data: any, addRoute: boolean = true) {
    var options: ClickOptions = {
      data: data,
      dataID: 'ID',
      update: 'fisma',
      detailModalID: '#fismaDetail',
      sysTableID: '#fismaCertSysTable',
      exportName: data.Name + '-Certified_Systems',
      systemApiStr: '/api/fisma/get/',
      addRoute: addRoute,
    };
    this.clickMethod(options);
  }

  public investTableClick(data: any, addRoute: boolean = true) {
    var options: ClickOptions = {
      data: data,
      dataID: 'ID',
      update: 'investment',
      detailModalID: '#investDetail',
      sysTableID: '#investRelSysTable',
      exportName: data.Name + '-Related_Systems',
      systemApiStr: '/api/investments/get/',
      addRoute: addRoute,
    };
    this.clickMethod(options);
  }

  public itStandTableClick(data: any, addRoute: boolean = true) {
    var options: ClickOptions = {
      data: data,
      dataID: 'ID',
      update: 'it-standard',
      detailModalID: '#itStandardDetail',
      sysTableID: '#itRelSysTable',
      exportName: data.Name + '-Related_Systems',
      systemApiStr: '/api/it_standards/get/',
      addRoute: addRoute,
    };
    $('#divProduct').removeClass("disabledDivProduct");
    $('#divVersion').removeClass("disabledDivVersion");
    $('#divRelease').removeClass("disabledDivRelease");
    this.clickMethod(options);
  }

  public orgsTableClick(data: any, addRoute: boolean = true) {
    var options: ClickOptions = {
      data: data,
      dataID: 'ID',
      update: 'organization',
      detailModalID: '#organizationDetail',
      sysTableID: '#orgSysTable',
      exportName: data.Name + '-Organizational_Systems',
      systemApiStr: null, // Should revert back when can use IDs again for actual org table instead of names
      addRoute: addRoute,
    };
    this.clickMethod(options);

    // Update related capabilities table in detail modal with clicked system
    this.updateRelatedTable(
      '#orgCapsTable',
      data.Name + '-Related_Capabilities',
      '/api/organizations/get/' + data.ID + '/capabilities'
    );

    // Update related capabilities table in detail modal with clicked system
    this.updateRelatedTable(
      '#orgSysTable',
      data.Name + '-Related_Systems',
      '/api/organizations/get/' + data.Name + '/systems'
    );
  }

  public recordsTableClick(data: any, addRoute: boolean = true) {
    var options: ClickOptions = {
      data: data,
      dataID: 'Rec_ID',
      update: 'record',
      detailModalID: '#recordDetail',
      sysTableID: '#recordsRelSysTable',
      exportName: data.Record_Item_Title + '-Related_Systems',
      systemApiStr: '/api/records/get/',
      addRoute: addRoute,
    };
    this.clickMethod(options);
  }

  public websitesTableClick(data: any, addRoute: boolean = true) {
    var options: ClickOptions = {
      data: data,
      dataID: 'website_id',
      update: 'website',
      detailModalID: '#websiteDetail',
      sysTableID: '#websitesRelSysTable',
      exportName: data.Website_Item_Title + '-Related_Systems',
      systemApiStr: '/api/websites/get/',
      addRoute: addRoute,
    };
    this.clickMethod(options);
  }

  public websiteServiceCategoryTableClick(data: any, addRoute: boolean = true) {
    var options: ClickOptions = {
      data: data,
      dataID: 'website_service_category_id',
      update: 'websiteServiceCategory',
      detailModalID: '#websiteServiceCategoryDetail',
      sysTableID: '',
      exportName: data.name + '',
      systemApiStr: '/api/website_service_category/get/', // Should revert back when can use IDs again for actual org table instead of names
      addRoute: addRoute,
    };
    this.clickMethod(options);
    // load the related websites list to display within the main modal tab
    this.apiService
      .getWebsiteServiceCategoryRelatedWebsites(data[options.dataID])
      .subscribe((websiteServiceCategoryWebsiteData: Website[]) => {
        $('#websiteServiceCategoryWebsites').bootstrapTable('refreshOptions', {
          exportOptions: {
            fileName: this.sharedService.fileNameFmt(
              data.name + '-related-websites'
            ),
          },
          data: websiteServiceCategoryWebsiteData,
        });
      });
  }

  public systemsTableClick(data: any, addRoute: boolean = true) {
    var options: ClickOptions = {
      data: data,
      dataID: 'ID',
      update: 'system',
      detailModalID: '#systemDetail',
      sysTableID: '#SubSysTable',
      exportName: data.Name + '-SubSystems',
      systemApiStr: '/api/systems/get/',
      addRoute: addRoute,
    };
    this.clickMethod(options);

    this.apiService.getSysTIME(data['ID']).subscribe((TIMEdata: any[]) => {
      if (TIMEdata[0]) {
        // Only continute if any data came back
        var timeAPIdata = TIMEdata[0];

        // Update TIME report table in detail modal with clicked system
        $('#sysTimeTable').bootstrapTable('refreshOptions', {
          exportOptions: {
            fileName: this.sharedService.fileNameFmt(
              timeAPIdata['System Name'] + '-TIME_Report'
            ),
          },
          data: [timeAPIdata],
        });
      }
    });

    // Update related capabilities table in detail modal with clicked system
    this.updateRelatedTable(
      '#systemCapTable',
      data.Name + '-Related_Capabilities',
      '/api/systems/get/' + String(data.ID) + '/capabilities'
    );

    // Update related technologies table in detail modal with clicked system
    this.updateRelatedTable(
      '#systemTechTable',
      data.Name + '-Related_Technologies',
      '/api/systems/get/' + String(data.ID) + '/technologies'
    );

    // Update related investments table in detail modal with clicked system
    this.updateRelatedTable(
      '#systemInvestTable',
      data.Name + '-Related_Investments',
      '/api/systems/get/' + String(data.ID) + '/investments'
    );

    // Update subsystems table in detail modal with clicked system
    this.updateRelatedTable(
      '#subSysTable',
      data.Name + '-Related_Subsystems',
      '/api/systems/get/' + String(data.ID) + '/subsystems'
    );

    // Update related records table in detail modal with clicked system
    var system_related_records = <any>[];

    // Join Records to System for Related Systems
    this.apiService
      .getSysRecords(data.ID)
      .subscribe((records_mappings: any[]) => {
        this.apiService.getRecords().subscribe((records: any[]) => {
          // Grab all Record IDs related to the one record
          var recordID_from_mappings = new Set(
            records_mappings.map(({ obj_records_Id }) => obj_records_Id)
          );
          // Filter Records to the IDs related to the one record
          system_related_records = records.filter(({ Rec_ID }) =>
            recordID_from_mappings.has(parseInt(Rec_ID))
          ); // Parse into int as GoogleAPI makes everything strings
          // Update related records table with filtered systems
          $('#systemRecTable').bootstrapTable('refreshOptions', {
            data: system_related_records,
          });
        });
      });
      
    // Update related websites table in detail modal with clicked system
    var system_related_websites = <any>[];
    
    // Join Websites to System for Related Systems
    
    this.apiService
      .getSysWebsites(data.ID)
      .subscribe((websites_mappings: any[]) => {
        this.apiService.getWebsites().subscribe((websites: any[]) => {
          // Grab all Website IDs related to the one website
          var websiteID_from_mappings = new Set(
            websites_mappings.map(({ obj_websites_Id }) => obj_websites_Id)
          );
          // Filter Websites to the IDs related to the one website
          system_related_websites = websites.filter(({ website_id }) =>
            websiteID_from_mappings.has(parseInt(website_id))
          ); // Parse into int as GoogleAPI makes everything strings
          // Update related websites table with filtered systems
          $('#systemWebsitesTable').bootstrapTable('refreshOptions', {
            data: system_related_websites,
          });
        });
      });
  }
  
  private clickMethod(options: ClickOptions) {
    this.modalService.updateDetails(
      options.data,
      options.update,
      options.addRoute
    );
    $(options.detailModalID).modal('show');

    // Change URL to include ID
    this.sharedService.addIDtoURL(options.data, options.dataID);

    var fullSystemAPIString = null;
    if (options.systemApiStr) {
      fullSystemAPIString =
        options.systemApiStr +
        String(options.data[options.dataID]) +
        '/systems';
    }

    // Update related systems table in detail modal with clicked data
    if (options.sysTableID) {
      this.updateRelatedTable(
        options.sysTableID,
        options.exportName,
        fullSystemAPIString
      );
    }
  }

  private updateRelatedTable(
    tableID: string,
    exportName: string,
    systemApiStr: string
  ) {
    if (systemApiStr) {
      $(tableID).bootstrapTable('refreshOptions', {
        exportOptions: {
          fileName: this.sharedService.fileNameFmt(exportName),
        },
        url: this.sharedService.internalURLFmt(systemApiStr),
      });
    } else {
      $(tableID).bootstrapTable('refreshOptions', {
        exportOptions: {
          fileName: this.sharedService.fileNameFmt(exportName),
        },
      });
    }
  }

  // Have to render artifacts info separately as anchor links dont work with ngFor
  public renderRelArtifacts(artifactString: string) {
    let artifacts = this.splitRelArtifacts(artifactString);
    let html = '';

    artifacts.forEach((artifact) => {
      html += `<li>
        <a href="${artifact.link}" target="_blank" rel="noopener">${artifact.name}</a>
      </li>`;
    });
    return html;
  }

  private splitRelArtifacts(artifacts) {
    var artObjs = [];

    if (artifacts) {
      var arts = artifacts.split(';');
      for (let index = 0; index < arts.length; index++) {
        let tmpObj: any = {};
        const art = arts[index];
        let pieces = art.split(',');

        tmpObj.name = pieces[0];
        tmpObj.link = pieces[1];

        artObjs.push(tmpObj);
      }
    }

    return artObjs;
  }

  // Have to render POC info separately as anchor links dont work with ngFor
  renderPOCInfoTable(pocString: string) {
    let POCs = this.splitPOCInfo(pocString);
    let html = '';
    POCs.forEach((p) => {
      if (p.phone)
        p.phone = `
        ${p.phone.substring(0, 4)}-${p.phone.substring(
          4,
          7
        )}-${p.phone.substring(7, 11)}`;
    });
    /*     POCs.forEach(p => {
      html += `<tr>
        <td>${p.type}</td>
        <td>${p.name}</td>`;

      if (p.phone)
        html += `<td>
          ${p.phone.substring(0, 4)}-${p.phone.substring(
          4,
          7
        )}-${p.phone.substring(7, 11)}
        </td>`;
      else html += '<td>None</td>';

      if (p.email)
        html += `<td>
        <a href="https://mail.google.com/mail/?view=cm&fs=1&to=${p.email}" target="_blank" rel="noopener">
          ${p.email}</a>
      </td>`;
      else html += '<td>None</td>';

      html += "</tr>"
    }); */
    return POCs;
  }

  private splitPOCInfo(p) {
    let poc = null;
    let poc1 = null;
    let pocs = [];

    if (p) {
      poc1 = p.split('*');
      poc1 = poc1.map((poctype, tmpObj) => {
        poctype = poctype.split(':');
        poc = poctype[1].split('; ');
        for (var i = 0; i < poc.length; i++) {
          var pieces = poc[i].split(',');
          tmpObj = null;
          if (pieces[0] !== '')
            tmpObj = {
              type: poctype[0],
              name: pieces[0],
              phone: pieces[2],
              email: pieces[1],
            };
          pocs.push(tmpObj);
        }
      });
    }

    return pocs.filter(function (el) {
      return el != null;
    });
  }

  public previousModalRoute(currentModalID: string) {
    // Close current modal
    $('#' + currentModalID).modal('hide');
    // Add event handler on close event
    $('#' + currentModalID).one('hidden.bs.modal', function (e) {
      this.processPreviousRoute();
    }.bind(this));
  }

  private processPreviousRoute() {
    
    // Get previous modal data
    let previousModal = this.globals.modalRoutes.pop();
    // Need to pop twice to get the previous modal instead of the current one just saved
    previousModal = this.globals.modalRoutes.pop();

    // Debug
    // console.log("previousModal: ", previousModal);
    // console.log("modalRoutes after pop: ", this.globals.modalRoutes);

    // Present previous modal data
    switch (previousModal.component) {
      case 'investment':
        this.investTableClick(previousModal.data);
        break;

      case 'capability':
        this.capsTableClick(previousModal.data);
        break;

      case 'organization':
        this.orgsTableClick(previousModal.data);
        break;

      case 'system':
        this.systemsTableClick(previousModal.data);
        break;

      case 'record':
        this.recordsTableClick(previousModal.data);
        break;

      case 'fisma':
        this.fismaTableClick(previousModal.data);
        break;

      case 'it-standard':
        this.itStandTableClick(previousModal.data);
        break;

      case 'website':
        this.websitesTableClick(previousModal.data);
        break;

      case 'websiteServiceCategory':
        this.websiteServiceCategoryTableClick(previousModal.data);
        break;

      default:
        break;
    }
  }

  public openRelated(detailID: string, ID: any, type: string) {
    $(detailID).modal('hide');

    if (type === 'investment') {
      this.apiService.getOneInvest(ID).subscribe((apiData: any) => {
        this.investTableClick(apiData[0]);
      });
    } else if (type === 'capability-name') {
      this.apiService.getOneCapName(ID).subscribe((apiData: any[]) => {
        this.capsTableClick(apiData[0]);
      });
    } else if (type === 'system') {
      this.apiService.getOneSys(ID).subscribe((apiData: any) => {
        this.systemsTableClick(apiData[0]);
      });
    } else if (type === 'org') {
      this.apiService.getOneOrg(ID).subscribe((apiData: any) => {
        this.orgsTableClick(apiData[0]);
      });
    } else if (type === 'fisma') {
      this.apiService.getOneFISMASys(ID).subscribe((apiData: any[]) => {
        this.fismaTableClick(apiData[0]);
      });
    }
  }

  // Set the gear_type and id in the url for global search
  private setGlobalSearchModalUrl(gear_type: string, id: string) {
    // Send page_view event to GA for modal view
    this.analyticsService.logPageViewEvent(`search/${gear_type}/${id}`);
    
    this.location.replaceState(`search/${gear_type}/${id}`);
  }

  // Call this to update the report table data
  public updateReportTableData(data: any) {
    this.reportTableDataSubject.next(data); 
  }

  public updateReportTableDataReadyStatus(isReady: boolean) {
    this.reportTableDataReadySubject.next(isReady);
  }

  public filterButtonClick(filterButtons: FilterButton[], data: any): void {
    let filteredData = data;
    for(let i = 0; i < filterButtons.length; i++) {
      for(let f = 0; f < filterButtons[i].filters.length; f++) {
        filteredData = filteredData.filter(x => {
          let dataFieldValue = x[filterButtons[i].filters[f].field];
          let filterValue = filterButtons[i].filters[f].value;
          if(typeof(dataFieldValue) === 'string') {
            dataFieldValue = dataFieldValue.toLocaleLowerCase();
          }
          if(typeof(filterValue) === 'string') {
            filterValue = filterValue.toLocaleLowerCase();
          }
          if(filterButtons[i].filters[f].matchMode === 'contains') {
            return dataFieldValue.includes(filterValue);
          } else {
            return dataFieldValue === filterValue;
          }
        });
      }
    }
    this.updateReportTableData(filteredData);
  }
}
