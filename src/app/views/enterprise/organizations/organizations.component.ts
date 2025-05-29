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
    selector: 'organizations',
    templateUrl: './organizations.component.html',
    styleUrls: ['./organizations.component.css'],
    standalone: false
})
export class OrganizationsComponent implements OnInit {
  row: Object = <any>{};

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
    this.modalService.currentInvest.subscribe((row) => (this.row = row));
  }

  // Organizations Table Options
  tableOptions: {} = this.tableService.createTableOptions({
    advancedSearch: true,
    idTable: 'OrgTable',
    classes: 'table-hover table-dark clickable-table',
    showColumns: false,
    showExport: true,
    exportFileName: 'GSA_Organizations',
    headerStyle: 'bg-royal-blue',
    pagination: true,
    search: true,
    sortName: 'OrgSymbol',
    sortOrder: 'asc',
    showToggle: true,
    url: this.apiService.orgUrl,
  });

  // Organizations Table Columns
  columnDefs: any[] = [
    {
      field: 'OrgSymbol',
      title: 'Org Symbol',
      sortable: true,
    },
    {
      field: 'Name',
      title: 'Organization Name',
      sortable: true,
    },
    {
      field: 'SSOName',
      title: 'SSO Name',
      sortable: true,
    },
    {
      field: 'TwoLetterOrgSymbol',
      title: 'Two Letter Org',
      sortable: true,
    },
    {
      field: 'TwoLetterOrgName',
      title: 'Two Letter Org Name',
      sortable: true,
    },
  ];

  ngOnInit(): void {
    // Enable popovers
    $(function () {
      $('[data-bs-toggle="popover"]').popover();
    });

    $('#orgTable').bootstrapTable(
      $.extend(this.tableOptions, {
        columns: this.columnDefs,
        data: [],
      })
    );

    const self = this;
    $(document).ready(() => {
      // Method to handle click events on the organization table
      $('#orgTable').on('click-row.bs.table', function (e, row) {
          this.tableService.orgsTableClick(row);
        }.bind(this));

      //Enable table sticky header
      self.sharedService.enableStickyHeader("orgTable");
  });

    // Method to open details modal when referenced directly via URL
    this.route.params.subscribe((params) => {
      var detailOrgID = params['orgID'];
      if (detailOrgID) {
        this.titleService.setTitle(
          `${this.titleService.getTitle()} - ${detailOrgID}`
        );
        this.apiService.getOneOrg(detailOrgID).subscribe((data: any[]) => {
          this.tableService.orgsTableClick(data[0]);
        });
      }
    });
  }
}
