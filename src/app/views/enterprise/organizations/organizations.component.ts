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
  selector: 'organizations',
  templateUrl: './organizations.component.html',
  styleUrls: ['./organizations.component.css']
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
    private tableService: TableService) {
    this.modalService.currentInvest.subscribe(row => this.row = row);
  }

  // Organizations Table Options
  tableOptions: {} = this.tableService.createTableOptions({
    advancedSearch: true,
    idTable: 'OrgTable',
    classes: "table-hover table-dark clickable-table",
    showColumns: false,
    showExport: true,
    exportFileName: 'GSA_Organizations',
    headerStyle: "bg-royal-blue",
    pagination: true,
    search: true,
    sortName: 'Parent',
    sortOrder: 'asc',
    showToggle: true,
    url: this.apiService.orgUrl
  });

  // Organizations Table Columns
  columnDefs: any[] = [{
    field: 'Parent',
    title: 'Parent',
    sortable: true
  }, {
    field: 'DisplayName',
    title: 'Short Name',
    sortable: true
  }, {
    field: 'Name',
    title: 'Organization Name',
    sortable: true
  }];

  ngOnInit(): void {
    // Enable popovers
    $(function () {
      $('[data-toggle="popover"]').popover()
    })

    $('#orgTable').bootstrapTable($.extend(this.tableOptions, {
      columns: this.columnDefs,
      data: [],
    }));

    // Method to handle click events on the organization table
    $(document).ready(
      $('#orgTable').on('click-row.bs.table', function (e, row) {
        this.tableService.orgsTableClick(row);
      }.bind(this)
      ));

      // Method to open details modal when referenced directly via URL
      this.route.params.subscribe(params => {
        var detailOrgID = params['orgID'];
        if (detailOrgID) {
          this.apiService.getOneOrg(detailOrgID).subscribe((data: any[]) => {
            this.tableService.orgsTableClick(data[0]);
          });
        };
      });  

  }

}
