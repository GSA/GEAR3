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
  sysTableID: string,
  exportName: string,
  systemApiStr: string
};

@Injectable({
  providedIn: 'root'
})
export class TableService {

  // Systems Related Table Options
  public relSysTableOptions: {} = this.createTableOptions({
    advancedSearch: true,
    idTable: 'RelSysTable',
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

  // Systems Related Table Columns
  public relSysColumnDefs: any[] = [{
    field: 'Name',
    title: 'System Name',
    sortable: true
  }, {
    field: 'Description',
    title: 'Description',
    sortable: true,
    visible: false,
    class: 'text-truncate'
  }, {
    field: 'SystemLevel',
    title: 'System Level',
    sortable: true
  }, {
    field: 'Status',
    title: 'Status',
    sortable: true
  }, {
    field: 'orgName',
    title: 'Responsible Org',
    sortable: true
  }, {
    field: 'CSP',
    title: 'Cloud Server Provider',
    sortable: true,
    visible: false
  }, {
    field: 'CloudYN',
    title: 'Cloud Hosted?',
    sortable: true,
    visible: false
  }, {
    field: 'AO',
    title: 'Authorizing Official',
    sortable: true,
    visible: false,
    formatter: this.sharedService.pocStringNameFormatter
  }, {
    field: 'SO',
    title: 'System Owner',
    sortable: true,
    visible: false,
    formatter: this.sharedService.pocStringNameFormatter
  }];


  constructor(
    private apiService: ApiService,
    private modalService: ModalsService,
    private sharedService: SharedService) { }


  public createTableOptions(definitions: any): {} {
    return {
      advancedSearch: definitions.advancedSearch,
      idTable: definitions.idTable,
      buttonsClass: 'info',
      cache: true,
      classes: "table table-bordered table-striped " + definitions.classes,
      showColumns: definitions.showColumns,
      showColumnsSearch: definitions.showColumns,

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
      searchOnEnterKey: definitions.search,
      showSearchButton: definitions.search,
      showSearchClearButton: definitions.search,
      visibleSearch: definitions.search,

      sortName: definitions.sortName,
      sortOrder: definitions.sortOrder,
      showToggle: definitions.showToggle,
      url: definitions.url
    };
  };


  public globalSearchTableClick(searchData: any) {
    // console.log("Global Search Table Clicked Row: ", data);  // Debug

    switch (searchData.GEAR_Type) {
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

      case 'System':  // TODO: need to change when gear_ods is fully transitioned
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


  public capsTableClick(data: any) {
    var options: ClickOptions = {
      data: data,
      update: 'capability',
      detailModalID: '#capabilityDetail',
      sysTableID: '#capSupportSysTable',
      exportName: data.Name + '-Supporting_Systems',
      systemApiStr: '/api/capabilities/get/'
    };
    this.clickMethod(options);
  }


  public fismaTableClick(data: any) {
    var options: ClickOptions = {
      data: data,
      update: 'fisma',
      detailModalID: '#fismaDetail',
      sysTableID: '#fismaCertSysTable',
      exportName: data.Name + '-Certified_Systems',
      systemApiStr: '/api/fisma/get/'
    };
    this.clickMethod(options);
  }


  public investTableClick(data: any) {
    var options: ClickOptions = {
      data: data,
      update: 'investment',
      detailModalID: '#investDetail',
      sysTableID: '#investRelSysTable',
      exportName: data.Name + '-Related_Systems',
      systemApiStr: '/api/investments/get/'
    };
    this.clickMethod(options);
  }


  public itStandTableClick(data: any) {
    var options: ClickOptions = {
      data: data,
      update: 'it-standard',
      detailModalID: '#itStandardDetail',
      sysTableID: '#itRelSysTable',
      exportName: data.Name + '-Related_Systems',
      systemApiStr: '/api/it_standards/get/'
    };
    this.clickMethod(options);
  }


  public orgsTableClick(data: any) {
    var options: ClickOptions = {
      data: data,
      update: 'organization',
      detailModalID: '#organizationDetail',
      sysTableID: '#orgSysTable',
      exportName: data.Name + '-Organizational_Systems',
      systemApiStr: null  // Should revert back when can use IDs again for actual org table instead of names
    };
    this.clickMethod(options);

    // Update related capabilities table in detail modal with clicked system
    this.updateRelatedTable(
      '#orgSysTable',
      data.Name + '-Related_Systems',
      '/api/organizations/get/' + data.Name + '/systems'
    );
  }


  public recordsTableClick(data: any) {
    var options: ClickOptions = {
      data: data,
      update: 'record',
      detailModalID: '#recordDetail',
      sysTableID: null, // '#recordsSysTable',
      exportName: null, // data.RecordTitle + '-Related_Systems',
      systemApiStr: null // '/api/records/get/'
    };
    this.clickMethod(options);
  }


  public systemsTableClick(data: any) {
    var options: ClickOptions = {
      data: data,
      update: 'system',
      detailModalID: '#systemDetail',
      sysTableID: '#SubSysTable',
      exportName: data.Name + '-SubSystems',
      systemApiStr: '/api/systems/get/'
    };
    this.clickMethod(options);

    this.apiService.getOneSysTIME(data['ID']).subscribe((TIMEdata: any[]) => {
      var timeAPIdata = TIMEdata[0];

    // Update TIME report table in detail modal with clicked system
      $('#sysTimeTable').bootstrapTable('refreshOptions', {
        exportOptions: {
          fileName: this.sharedService.fileNameFmt(timeAPIdata['System Name'] + '-TIME_Report')
        },
        data: [timeAPIdata]
      });
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
  }

  private clickMethod(options: ClickOptions) {
    // console.log("Clicked Row Data: ", options.data);  // Debug

    this.modalService.updateDetails(options.data, options.update);
    $(options.detailModalID).modal('show');

    // Update related systems table in detail modal with clicked data
    if (options.sysTableID) {
      this.updateRelatedTable(
        options.sysTableID,
        options.exportName,
        options.systemApiStr + String(options.data.ID) + '/systems'
      );
    };
  }

  private updateRelatedTable(tableID: string, exportName: string, systemApiStr: string) {
    $(tableID).bootstrapTable('refreshOptions', {
      exportOptions: {
        fileName: this.sharedService.fileNameFmt(exportName)
      },
      url: this.sharedService.internalURLFmt(systemApiStr)
    });
  }

  // Have to render artifacts info separately as anchor links dont work with ngFor
  public renderRelArtifacts(artifactString: string) {
    let artifacts = this.splitRelArtifacts(artifactString)
    let html = ''

    artifacts.forEach(artifact => {
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
    let POCs = this.splitPOCInfo(pocString)
    let html = ''

    POCs.forEach(p => {
      html += `<tr>
        <td>${p.type}</td>
        <td>${p.name}</td>`

      if (p.phone) html += `<td>
          ${p.phone.substring(0, 4)}-${p.phone.substring(4, 7)}-${p.phone.substring(7, 11)}
        </td>`
      else html += "<td>None</td>"

      if (p.email) html += `<td>
        <a href="https://mail.google.com/mail/?view=cm&fs=1&to=${p.email}" target="_blank" rel="noopener">
          ${p.email}</a>
      </td>`
      else html += "<td>None</td>"

      html += "</tr>"
    });
    return html;
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
      })
    }

    return pocs.filter(function (el) {
      return el != null;
    });
  }

}