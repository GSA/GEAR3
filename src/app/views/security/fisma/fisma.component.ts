import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { ApiService } from '@services/apis/api.service';
import { ModalsService } from '@services/modals/modals.service';
import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';

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
    private apiService: ApiService,
    private location: Location,
    private modalService: ModalsService,
    private route: ActivatedRoute,
    private router: Router,
    private sharedService: SharedService,
    private tableService: TableService) {
    this.modalService.currentFismaSys.subscribe(row => this.row = row);
  }

  // FISMA System Table Options
  tableOptions: {} = this.tableService.createTableOptions({
    advancedSearch: true,
    idTable: 'FismaTable',
    classes: "table-hover table-dark clickable-table",
    showColumns: true,
    showExport: true,
    exportFileName: 'GSA_FISMA_Systems_Inventory',
    headerStyle: "bg-warning",
    pagination: true,
    search: true,
    sortName: 'Name',
    sortOrder: 'asc',
    showToggle: true,
    url: this.apiService.fismaUrl
  });

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
    formatter: this.sharedService.dateFormatter
  }, {
    field: 'ATOType',
    title: 'ATO Type',
    sortable: true
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
    sortable: true,
    visible: false
  }, {
    field: 'SystemLevel',
    title: 'System Level',
    sortable: true,
    visible: false
  }, {
    field: 'RelatedArtifacts',
    title: 'Related Artifacts',
    formatter: this.sharedService.relArtifactsFormatter
  }, {
    field: 'FISMASystemIdentifier',
    title: 'FISMA System Identifier',
    sortable: true,
    visible: false
  }, {
    field: 'Status',
    title: 'Status',
    sortable: true
  }];

  ngOnInit(): void {
    // Enable popovers
    $(function () {
      $('[data-toggle="popover"]').popover()
    })

    $('#fismaTable').bootstrapTable($.extend(this.tableOptions, {
      columns: this.columnDefs,
      data: [],
    }));

    // Filter out "Pending" Status
    $(document).ready(
      $('#fismaTable').bootstrapTable('filterBy', {
        Status: ['Active']
      })
    );

    // Method to handle click events on the FISMA Systems table
    $(document).ready(
      $('#fismaTable').on('dbl-click-row.bs.table', function (e, row) {
        this.tableService.fismaTableClick(row);

        // Change URL to include ID
        var normalizedURL = this.sharedService.coreURL(this.router.url);
        this.location.replaceState(`${normalizedURL}/${row.ID}`);
      }.bind(this)
      ));

      // Method to open details modal when referenced directly via URL
      this.route.params.subscribe(params => {
        var detailFismaID = params['fismaID'];
        if (detailFismaID) {
          this.apiService.getOneFISMASys(detailFismaID).subscribe((data: any[]) => {
            this.tableService.fismaTableClick(data[0]);
          });
        };
      });  

  }

  // Update table to Retire Systems
  showRetired() {
    this.retiredTable = true;  // Expose main table button after RISSO button is pressed

    this.columnDefs.push({
      field: 'InactiveDate',
      title: 'Inactive Date',
      sortable: true,
      formatter: this.sharedService.dateFormatter
    })

    // Change columns, filename, and url
    $('#fismaTable').bootstrapTable('refreshOptions', {
      columns: this.columnDefs,
      exportOptions: {
        fileName: this.sharedService.fileNameFmt('GSA_Retired_FISMA_Systems')
      }
    });

    // Filter to only "Inactive" Status
    $('#fismaTable').bootstrapTable('filterBy', {
      Status: ['Inactive']
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
      }
    });

    // Filter back to "Active" Status
    $('#fismaTable').bootstrapTable('filterBy', {
      Status: ['Active']
    });
  }

}
