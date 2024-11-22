import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { ApiService } from '@services/apis/api.service';
import { ModalsService } from '@services/modals/modals.service';
import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';
import { Title } from '@angular/platform-browser';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'fisma',
  templateUrl: './fisma.component.html',
  styleUrls: ['./fisma.component.css'],
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
    private tableService: TableService,
    private titleService: Title
  ) {
    this.modalService.currentFismaSys.subscribe((row) => (this.row = row));
  }

  // FISMA System Table Options
  tableOptions: {} = this.tableService.createTableOptions({
    advancedSearch: true,
    idTable: 'FismaTable',
    classes: 'table-hover table-dark clickable-table',
    showColumns: true,
    showExport: true,
    exportFileName: 'GSA_FISMA_Systems_Inventory',
    exportIgnoreColumn:[],
    headerStyle: 'bg-warning',
    pagination: true,
    search: true,
    sortName: 'Name',
    sortOrder: 'asc',
    showToggle: true,
    url: this.apiService.fismaUrl,
  });

  // FISMA System Table Columns
  columnDefs: any[] = [
    /* {
    field: 'DisplayName',
    title: 'Alias/Acronym',
    sortable: true
  }, */ {
      field: 'ID',
      title: 'ID',
      sortable: true,
      visible: false,
    },
    {
      field: 'Name',
      title: 'System Name',
      sortable: true,
    },
    {
      field: 'Status',
      title: 'Status',
      sortable: true,
      visible: false,
    },
    {
      field: 'ATODate',
      title: 'ATO Date',
      sortable: true,
      formatter: this.sharedService.dateFormatter,
    },
    {
      field: 'RenewalDate',
      title: 'Renewal Date',
      sortable: true,
      formatter: this.sharedService.dateFormatter,
    },
    {
      field: 'ATOType',
      title: 'ATO Type',
      sortable: true,
    },
    {
      field: 'FIPS_Impact_Level',
      title: 'FIPS Impact Level',
      sortable: true,
    },
    {
      field: 'RelatedArtifacts',
      title: 'Related Artifacts',
      sortable: true,
      formatter: this.sharedService.relArtifactsFormatter,
    },
    {
      field: 'Description',
      title: 'Description',
      sortable: true,
      visible: true,
      formatter: this.sharedService.formatDescription
    },
    {
      field: 'ParentName',
      title: 'Parent System',
      sortable: true,
      visible: false,
    },
    {
      field: 'Reportable',
      title: 'FISMA Reportable',
      sortable: true,
      visible: false,
    },
    {
      field: 'PII',
      title: 'PII',
      sortable: true,
      visible: false,
    },
    {
      field: 'CUI',
      title: 'CUI',
      sortable: true,
      visible: false,
    },
    {
      field: 'FedContractorLoc',
      title: 'Fed or Contractor System',
      sortable: true,
      visible: false,
    },
    {
      field: 'RespOrg',
      title: 'Responsible Org',
      sortable: true,
      visible: false,
    },
    {
      field: 'ServiceType',
      title: 'Cloud Service Type',
      sortable: true,
      visible: false,
    },
    {
      field: 'FISMASystemIdentifier',
      title: 'FISMA System Identifier',
      sortablle: true,
      visible: false
    }, /* , {
    field: 'BusOrg',
    title: 'Business Org',
    sortable: true,
    visible: false
  } ,*/
  ];

  ngOnInit(): void {
    // Enable popovers
    $(function () {
      $('[data-toggle="popover"]').popover();
    });

    $('#fismaTable').bootstrapTable(
      $.extend(this.tableOptions, {
        columns: this.columnDefs,
        data: [],
      })
    );

    const self = this;
    $(document).ready(() => {
      // Filter out "Pending" Status
      $('#fismaTable').bootstrapTable('filterBy', {
        Status: 'Active',
        SystemLevel: 'System',
        Reportable: 'Yes',
      });

      // Method to handle click events on the FISMA Systems table
      $('#fismaTable').on(
        'click-row.bs.table',
        function (e, row, $element, field) {        
          if (field !== 'RelatedArtifacts' ) {
            this.tableService.fismaTableClick(row);
          }
        }.bind(this)
      );

      //Enable table sticky header
      self.sharedService.enableStickyHeader("fismaTable");
  });

    // Method to open details modal when referenced directly via URL
    this.route.params.subscribe((params) => {
      var detailFismaID = params['fismaID'];
      if (detailFismaID) {
        this.titleService.setTitle(
          `${this.titleService.getTitle()} - ${detailFismaID}`
        );
        this.apiService
          .getOneFISMASys(detailFismaID)
          .subscribe((data: any[]) => {
            this.tableService.fismaTableClick(data[0]);
          });
      }
    });
  }

  // Update table to Retire Systems
  showRetired() {
    this.sharedService.disableStickyHeader("fismaTable");
    this.retiredTable = true; // Expose main table button after "Retired" button is pressed

    this.columnDefs.push({
      field: 'InactiveDate',
      title: 'Inactive Date',
      sortable: true,
      formatter: this.sharedService.dateFormatter,
    });

    // Change columns, filename, and url
    $('#fismaTable').bootstrapTable('refreshOptions', {
      columns: this.columnDefs,
      exportOptions: {
        fileName: this.sharedService.fileNameFmt('GSA_Retired_FISMA_Systems'),
      },
    });

    // Filter to only "Inactive" Status
    $('#fismaTable').bootstrapTable('filterBy', {
      Status: ['Inactive'],
    });
    this.sharedService.enableStickyHeader("fismaTable");
  }

  backToMainFisma() {
    this.sharedService.disableStickyHeader("fismaTable");
    this.retiredTable = false; // Hide main button

    // Change back to default
    this.columnDefs.pop();
    $('#fismaTable').bootstrapTable('refreshOptions', {
      columns: this.columnDefs,
      exportOptions: {
        fileName: this.sharedService.fileNameFmt('GSA_FISMA_Systems_Inventory'),
      },
    });

    // Filter back to "Active" Status
    $('#fismaTable').bootstrapTable('filterBy', {
      Status: 'Active',
      SystemLevel: 'System',
      Reportable: 'Yes',
    });
    this.sharedService.enableStickyHeader("fismaTable");
  }
}
