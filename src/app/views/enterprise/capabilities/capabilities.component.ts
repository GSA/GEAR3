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
standalone: false,
  selector: 'capabilities',
  templateUrl: './capabilities.component.html',
  styleUrls: ['./capabilities.component.css'],
})
export class CapabilitiesComponent implements OnInit {
  row: Object = <any>{};
  ssoTable: boolean = false;
  filterTitle: string = '';

  constructor(
    private apiService: ApiService,
    private location: Location,
    private modalService: ModalsService,
    private route: ActivatedRoute,
    private router: Router,
    public sharedService: SharedService,
    private tableService: TableService,
    private titleService: Title
  ) {
    this.modalService.currentCap.subscribe((row) => (this.row = row));
  }

  // Capabilities Table Options
  tableOptions: {} = this.tableService.createTableOptions({
    advancedSearch: true,
    idTable: 'CapTable',
    classes: 'table-hover table-dark clickable-table fixed-table',
    showColumns: false,
    showExport: true,
    exportFileName: 'GSA_Business_Capabilities',
    headerStyle: 'bg-royal-blue',
    pagination: true,
    search: true,
    sortName: 'ReferenceNum',
    sortOrder: 'asc',
    showToggle: true,
    url: this.apiService.capUrl,
  });

  // Capabilities Table Columns
  capColumnDefs: any[] = [
    {
      field: 'ReferenceNum',
      title: 'Ref Id',
      sortable: true,
    },
    {
      field: 'Name',
      title: 'Capability Name',
      sortable: true,
    },
    {
      field: 'Description',
      title: 'Description',
      sortable: true,
      class: 'text-truncate',
    },
    {
      field: 'Level',
      title: 'Level',
      sortable: true,
    },
    {
      field: 'Parent',
      title: 'Parent',
      sortable: true,
    },
  ];

  // Capabilities by SSO Table Columns
  ssoColumnDefs: any[] = [
    {
      field: 'ReferenceNum',
      title: 'Ref Id',
      sortable: true,
    },
    {
      field: 'Name',
      title: 'Capability Name',
      sortable: true,
    },
    {
      field: 'Description',
      title: 'Description',
      sortable: true,
      class: 'text-truncate',
    },
    {
      field: 'Level',
      title: 'Level',
      sortable: true,
    },
    {
      field: 'ParentCap',
      title: 'Parent',
      sortable: true,
    },
    {
      field: 'Organizations',
      title: 'SSO',
      sortable: true,
    },
    {
      field: 'Applications',
      title: 'Apps',
      sortable: true,
    },
  ];

  ngOnInit(): void {
    // Enable popovers
    $(function () {
      $('[data-bs-toggle="popover"]').popover();
    });

    // Set JWT when logged into GEAR Manager when returning from secureAuth
    this.sharedService.setJWTonLogIn();

    $('#capTable').bootstrapTable(
      $.extend(this.tableOptions, {
        columns: this.capColumnDefs,
        data: [],
      })
    );

    const self = this;
    $(document).ready(() => {
      // Method to handle click events on the capabilities table
      $('#capTable').on('click-row.bs.table', function (e, row) {
        self.tableService.capsTableClick(row);
      }.bind(this));

      //Enable table sticky header
      self.sharedService.enableStickyHeader("capTable");
  });

    // Method to open details modal when referenced directly via URL
    this.route.params.subscribe((params) => {
      var detailCapID = params['capID'];
      if (detailCapID) {
        this.titleService.setTitle(
          `${this.titleService.getTitle()} - ${detailCapID}`
        );
        this.apiService.getOneCap(detailCapID).subscribe((data: any[]) => {
          this.tableService.capsTableClick(data[0]);
        });
      }
    });
  }

  // Update table, filtering by SSO
  changeCapSSO(sso: string) {
    this.ssoTable = true; // SSO filters are on, expose main table button

    $('#capTable').bootstrapTable('refreshOptions', {
      columns: this.ssoColumnDefs,
      idTable: 'advSearchCapSSOTable',
      exportOptions: {
        fileName: this.sharedService.fileNameFmt(
          'GSA_Business_Capabilities_by_SSO'
        ),
      },
      url: this.apiService.capUrl + '/sso/' + sso,
    });

    this.filterTitle = `${sso} `;
  }

  backToMainCap() {
    this.ssoTable = false; // Hide main button

    $('#capTable').bootstrapTable('refreshOptions', {
      columns: this.capColumnDefs,
      idTable: 'advSearchCapTable',
      exportOptions: {
        fileName: this.sharedService.fileNameFmt('GSA_Business_Capabilities'),
      },
      url: this.apiService.capUrl,
    });

    this.filterTitle = '';
  }
}
