import { Component, OnInit } from '@angular/core';
import { formatDate, Location } from '@angular/common';

import { ModalsService } from '../../services/modals/modals.service';
import { SharedService } from '../../services/shared/shared.service';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'fisma',
  templateUrl: './fisma.component.html',
  styleUrls: ['./fisma.component.css']
})
export class FismaComponent implements OnInit {

  row: Object = <any>{};
  retiredTable: boolean = false;

  constructor(
    private location: Location,
    private sharedService: SharedService,
    private modalService: ModalsService) {
      this.modalService.currentFismaSys.subscribe(row => this.row = row);
  }

  // FISMA System Table Options
  tableOptions: {} = {
    advancedSearch: true,
    idTable: 'advSearchFismaTable',
    buttonsClass: 'info',
    cache: true,
    classes: "table table-bordered table-striped table-hover table-dark",
    showColumns: true,
    showExport: true,
    exportDataType: 'all',
    exportOptions: {
      fileName: this.sharedService.fileNameFmt('GSA_FISMA_Systems_Inventory')
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
    url: this.location.prepareExternalUrl('/api/fisma')
  };

  // FISMA System Table Columns
  columnDefs: any[] = [{
    field: 'Name',
    title: 'System Name',
    sortable: true
  }, {
    field: 'orgName',
    title: 'Responsible Org',
    sortable: true
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
    formatter: this.dateFormatter
  }, {
    field: 'ATOType',
    title: 'ATO Type',
    sortable: true
  }, {
    field: 'RenewalDate',
    title: 'Renewal Date',
    sortable: true,
    formatter: this.dateFormatter
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
    sortable: true,
    visible: false
  }, {
    field: 'RelatedArtifacts',
    title: 'Related Artifacts',
    formatter: this.relArtifactsFormatter
  }, {
    field: 'FISMASystemIdentifier',
    title: 'FISMA System Identifier',
    sortable: true,
    visible: false
  }];

  ngOnInit(): void {
    $('#fismaTable').bootstrapTable($.extend(this.tableOptions, {
      columns: this.columnDefs,
      data: [],
    }));

    // Method to handle click events on the FISMA Systems table
    $(document).ready(
      $('#fismaTable').on('dbl-click-row.bs.table', function (e, row) {
        // console.log("FISMA System Table Clicked Row: ", row);  // Debug

        this.modalService.updateDetails(row, 'fisma');
        $('#fismaDetail').modal('show');

        // Update related apps table in detail modal with clicked FISMA system
        $('#fismaCertAppsTable').bootstrapTable('refreshOptions', {
          exportOptions: {
            fileName: this.sharedService.fileNameFmt(row.Name + '-Certified_Apps')
          },
          url: this.location.prepareExternalUrl('/api/fisma/' 
            + String(row.ID) + '/applications')
        })

      }.bind(this)
    ));

  }

  relArtifactsFormatter(value, row, index, field) {
    var artifacts = value;
    var artLinks = [];

    if (artifacts) {
      var arts = artifacts.split(';');

      arts = arts.map((artifact, tmpObj) => {
        let pieces = artifact.split(',');
        let linkStr = '<a class="no-propagation" target="_blank" href="' +
          pieces[1] + '">' + ' ' + pieces[0] + '</a>'

        artLinks.push(linkStr);
      })
    }

    return artLinks.join('<br>');
  };

  dateFormatter(value, row, index, field) {
    return formatDate(value, 'yyyy-MM-dd', 'en-US');
  };

  // Update table to Retire Systems
  showRetired() {
    this.retiredTable = true;  // Expose main table button after RISSO button is pressed

    this.columnDefs.push({
      field: 'InactiveDate',
      title: 'Inactive Date',
      sortable: true,
      formatter: this.dateFormatter
    })

    // Change columns, filename, and url
    $('#fismaTable').bootstrapTable('refreshOptions', {
      columns: this.columnDefs,
      exportOptions: {
        fileName: this.sharedService.fileNameFmt('GSA_Retired_FISMA_Systems')
      },
      url: this.location.prepareExternalUrl('/api/fisma/retired')
    });
  }

  backToMainFisma() {
    this.retiredTable = false;  // Hide main button

    // Change back to default
    this.columnDefs.pop();
    $('#fismaTable').bootstrapTable('refreshOptions', {
      columns: this.columnDefs,
      exportOptions: {
        fileName: this.sharedService.fileNameFmt('GSA_FISMA_Systems_Inventory')
      },
      url: this.location.prepareExternalUrl('/api/fisma')
    });
  }

}
