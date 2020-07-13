import { Component, OnInit } from '@angular/core';

import { ModalsService } from '../../services/modals/modals.service';
import { SharedService } from '../../services/shared/shared.service';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'fisma-pocs',
  templateUrl: './fisma-pocs.component.html',
  styleUrls: ['./fisma-pocs.component.css']
})
export class FismaPocsComponent implements OnInit {

  row: Object = <any>{};
  rissoTable: boolean = false;

  constructor(
    private sharedService: SharedService,
    private modalService: ModalsService) {
    this.modalService.currentFismaSys.subscribe(row => this.row = row);
  }

  // FISMA POC Table Options
  pocTableOptions: {} = {
    advancedSearch: true,
    idTable: 'advSearchFismaTable',
    buttonsClass: 'info',
    cache: true,
    classes: "table table-bordered table-striped table-hover table-dark clickable-table",
    showColumns: true,
    showExport: true,
    exportDataType: 'all',
    exportOptions: {
      fileName: this.sharedService.fileNameFmt('GSA_FISMA_POCs')
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
    url: this.sharedService.internalURLFmt('/api/fisma')
  };

  // FISMA POC Table Columns
  pocColumnDefs: any[] = [{
    field: 'Name',
    title: 'System Name',
    sortable: true
  }, {
    field: 'orgName',
    title: 'Responsible SSO',
    sortable: true
  }, {
    field: 'FIPS_Impact_Level',
    title: 'FIPS Impact Level',
    sortable: true
  }, {
    field: 'ISSM',
    title: 'ISSM',
    sortable: true,
    formatter: this.pocFormatter
  }, {
    field: 'ISSO',
    title: 'ISSO',
    sortable: true,
    formatter: this.pocFormatter
  }, {
    field: 'System Owner',
    title: 'System Owner',
    sortable: true,
    formatter: this.pocFormatter
  }, {
    field: 'Authorizing Official',
    title: 'Authorizing Official',
    sortable: true,
    visible: false,
    formatter: this.pocFormatter
  }, {
    field: 'CO',
    title: 'Contracting Officer',
    sortable: true,
    visible: false,
    formatter: this.pocFormatter
  }, {
    field: 'COR',
    title: 'Contracting Officer Rep.',
    sortable: true,
    visible: false,
    formatter: this.pocFormatter
  }];

  // RISSO POCs Table Columns
  rissoColumnDefs: any[] = [{
    field: 'Name',
    title: 'Name',
    sortable: true
  }, {
    field: 'Organization',
    title: 'Organization',
    sortable: true
  }, {
    field: 'RISSO_Region',
    title: 'Region',
    sortable: true
  }, {
    field: 'Phone',
    title: 'Phone',
    sortable: true
  }, {
    field: 'Email',
    title: 'Email',
    sortable: true,
    formatter: this.emailFormatter
  }];

  ngOnInit(): void {
    // Enable popovers
    $(function () {
      $('[data-toggle="popover"]').popover()
    })

    $('#fismaPOCTable').bootstrapTable($.extend(this.pocTableOptions, {
      columns: this.pocColumnDefs,
      data: [],
    }));

    $('#rissoPOCTable').bootstrapTable($.extend(this.pocTableOptions, {
      columns: this.rissoColumnDefs,
      data: [],
    }));

    // Method to handle click events on the FISMA POC table
    $(document).ready(
      $('#fismaPOCTable').on('dbl-click-row.bs.table', function (e, row) {
        // console.log("FISMA POC Table Clicked Row: ", row);  // Debug

        this.modalService.updateDetails(row, 'fisma');
        $('#fismaDetail').modal('show');

        // Update related apps table in detail modal with clicked FISMA POC
        $('#fismaCertAppsTable').bootstrapTable('refreshOptions', {
          exportOptions: {
            fileName: this.sharedService.fileNameFmt(row.Name + '-Certified_Apps')
          },
          url: this.sharedService.internalURLFmt('/api/fisma/get/'
            + String(row.ID) + '/applications')
        })

      }.bind(this)
      ));

  }

  pocFormatter(value, row, index, field) {
    const p = row.POC;
    let poc = null;
    let poc1 = null;
    let pocs = [];

    // Split by POC Type
    if (p) {
      poc1 = p.split('*');

      // For every POC Type
      for (let index = 0; index < poc1.length; index++) {
        var poctype = poc1[index];
        // Split if multiple POCs in same type
        poctype = poctype.split(':');

        // Only continue for POC type matching the desired field
        if (poctype[0] === field) {
          poc = poctype[1].split('; ');

          // For every POC
          for (var i = 0; i < poc.length; i++) {
            // Split the different components
            let pieces = poc[i].split(',');

            let tmpObj = {
              name: pieces[0],
              phone: pieces[2],
              email: pieces[1],
            };

            let linkStr = null;

            // Only continue if name exists
            if (tmpObj.name) {
              linkStr = tmpObj.name + '<br>';

              // Format email into a HTML link
              if (tmpObj.email) {
                linkStr += '<a href="https://mail.google.com/mail/?view=cm&fs=1&to=' +
                  tmpObj.email + '" target="_blank">' + ' ' + tmpObj.email + '</a><br>'
              }

              // Format number into phone format
              if (tmpObj.phone) {
                linkStr += tmpObj.phone.substring(0, 4) + '-' +
                  tmpObj.phone.substring(4, 7) + '-' +
                  tmpObj.phone.substring(7, 11) + '<br>'
              }

              pocs.push(linkStr);
            }
          }
        }
      }
    }

    // Block each POC's info with breaks
    return pocs.join('<br><br>');
  }

  emailFormatter(value, row, index, field) {
    return '<a href="https://mail.google.com/mail/?view=cm&fs=1&to=' +
      value + '" target="_blank">' + ' ' + value + '</a>'
  }

  // Update table to RISSO POCs
  showRISSOs() {
    this.rissoTable = true;  // Expose main table button after RISSO button is pressed

    // Change columns, filename, and url
    $('#rissoPOCTable').bootstrapTable('refreshOptions', {
      exportOptions: {
        fileName: this.sharedService.fileNameFmt('GSA_RISSO_POCs')
      },
      url: this.sharedService.internalURLFmt('/api/pocs/risso')
    });
  }

  backToMainFisma() {
    this.rissoTable = false;  // Hide main button
  }

}
