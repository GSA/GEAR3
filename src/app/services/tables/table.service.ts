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
  apiString: string
};

@Injectable({
  providedIn: 'root'
})
export class TableService {

  // Systems Related Table Options
  public relSysTableOptions: {} = this.createTableOptions({
    advancedSearch: true,
    idTable: 'RelSysTable',
    classes: "table-hover table-light clickable-table fixed-table",
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
    field: 'orgName',
    title: 'Responsible Org',
    sortable: true
  }, {
    field: 'Description',
    title: 'Description',
    sortable: true,
    class: 'text-truncate'
  }, {
    field: 'FedContractorLoc',
    title: 'Federal/Contractor',
    sortable: true,
    visible: false
  }, {
    field: 'FIPS_Impact_Level',
    title: 'FIPS Impact Level',
    sortable: true,
    visible: false
  }, {
    field: 'ATODate',
    title: 'ATO Date',
    sortable: true,
    visible: false,
    formatter: this.sharedService.dateFormatter
  }, {
    field: 'ATOType',
    title: 'ATO Type',
    sortable: true,
    visible: false
  }, {
    field: 'RenewalDate',
    title: 'Renewal Date',
    sortable: true,
    formatter: this.sharedService.dateFormatter
  }, {
    field: 'ComplFISMA',
    title: 'Complete Assessment For Current FY',
    sortable: true,
    visible: false
  }, {
    field: 'PII',
    title: 'PII',
    sortable: true,
    visible: false
  }, {
    field: 'CloudYN',
    title: 'Cloud Hosted?',
    sortable: true,
    visible: false
  }, {
    field: 'CSP',
    title: 'Cloud Server Provider',
    sortable: true,
    visible: false
  }, {
    field: 'ServiceType',
    title: 'Type of Service',
    sortable: true
  }, {
    field: 'SharedService',
    title: "Gov't-Wide Shared Service",
    sortable: true
  }, {
    field: 'SystemLevel',
    title: 'System Level',
    sortable: true
  }, {
    field: 'FISMASystemIdentifier',
    title: 'FISMA System Identifier',
    sortable: true,
    visible: false
  }, {
    field: 'SubSystem_Tag',
    title: 'SubSystem Identifier Tag',
    sortable: true,
    visible: false
  }, {
    field: 'RelatedArtifacts',
    title: 'Related Artifacts',
    formatter: this.sharedService.relArtifactsFormatter,
    sortable: false,
    visible: false
  }, {
    field: 'Status',
    title: 'Status',
    sortable: true
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
      apiString: '/api/capabilities/get/'
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
      apiString: '/api/fisma/get/'
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
      apiString: '/api/investments/get/'
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
      apiString: '/api/it_standards/get/'
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
      apiString: '/api/organizations/get/'
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
      apiString: '/api/systems/get/'
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
        options.apiString + String(options.data.ID) + '/systems'
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
  renderPOCInfo(pocString: string) {
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