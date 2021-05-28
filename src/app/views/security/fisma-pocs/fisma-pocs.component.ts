import { Component, OnInit } from '@angular/core';

import { ApiService } from '@services/apis/api.service';
import { ModalsService } from '@services/modals/modals.service';
import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'fisma-pocs',
  templateUrl: './fisma-pocs.component.html',
  styleUrls: ['./fisma-pocs.component.css']
})
export class FismaPocsComponent implements OnInit {

  row: Object = <any>{};

  constructor(
    private apiService: ApiService,
    private sharedService: SharedService,
    private modalService: ModalsService,
    private tableService: TableService) {
    this.modalService.currentFismaSys.subscribe(row => this.row = row);
  }

  // FISMA POC Table Options
  pocTableOptions: {} = this.tableService.createTableOptions({
    advancedSearch: true,
    idTable: 'FismaPOCTable',
    classes: "table-hover table-dark clickable-table",
    showColumns: true,
    showExport: true,
    exportFileName: 'GSA_FISMA_POCs',
    headerStyle: "bg-warning",
    pagination: true,
    search: true,
    sortName: 'Name',
    sortOrder: 'asc',
    showToggle: true,
    url: this.apiService.fismaUrl
  });

  // FISMA POC Table Columns
  pocColumnDefs: any[] = [{
    field: 'Name',
    title: 'System Name',
    sortable: true
  }, {
    field: 'FIPS_Impact_Level',
    title: 'FIPS Impact Level',
    sortable: true
  }, {
    field: 'Authorizing Official',
    title: 'Authorizing Official',
    sortable: true,
    formatter: this.pocFormatter
  }, {
    field: 'System Owner',
    title: 'System Owner',
    sortable: true,
    formatter: this.pocFormatter
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
    field: 'orgName',
    title: 'Responsible SSO',
    sortable: true,
    visible: false
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
          url: this.apiService.fismaUrl + '/get/' + String(row.ID) + '/applications'
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
          
          // Return if there are no POCs in this field
          if (poc[0] === '') {
            return 'None Provided';
          } else {
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
                  linkStr += `<a href="https://mail.google.com/mail/?view=cm&fs=1&to=${tmpObj.email}"
                    target="_blank" rel="noopener">${tmpObj.email}</a><br>`
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
    } else {
      return 'None Provided';
    }

  }

}
