import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { ApiService } from '@services/apis/api.service';
import { ModalsService } from '@services/modals/modals.service';
import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';

import { ITStandards } from '@api/models/it-standards.model';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'it-standards',
  templateUrl: './it-standards.component.html',
  styleUrls: ['./it-standards.component.css']
})
export class ItStandardsComponent implements OnInit {

  row: Object = <any>{};
  filteredTable: boolean = false;
  filterTitle: string = '';

  constructor(
    private apiService: ApiService,
    private location: Location,
    private modalService: ModalsService,
    private route: ActivatedRoute,
    private router: Router,
    public sharedService: SharedService,
    private tableService: TableService) {
    this.modalService.currentITStand.subscribe(row => this.row = row);
  }

  // IT Standard Table Options
  tableOptions: {} = this.tableService.createTableOptions({
    advancedSearch: true,
    idTable: 'ITStandardTable',
    classes: "table-hover table-dark clickable-table fixed-table",
    showColumns: true,
    showExport: true,
    exportFileName: 'GSA_IT_Standards',
    headerStyle: "bg-teal",
    pagination: true,
    search: true,
    sortName: 'Name',
    sortOrder: 'asc',
    showToggle: true,
    url: this.apiService.techUrl
  });

  // IT Standard Table Columns
  columnDefs: any[] = [{
    field: 'Name',
    title: 'Standard Name',
    sortable: true
  }, {
    field: 'Description',
    title: 'Description',
    sortable: true,
    class: 'text-truncate'
  }, {
    field: 'Category',
    title: 'Category',
    sortable: true
  }, {
    field: 'Status',
    title: 'Status',
    sortable: true
  }, {
    field: 'StandardType',
    title: 'Standard Type',
    sortable: true
  }, {
    field: 'DeploymentType',
    title: 'Deployment Type',
    sortable: true
  }, {
    field: 'ComplianceStatus',
    title: '508 Compliance',
    sortable: true
  }, {
    field: 'POC',
    title: 'POC',
    sortable: true,
    visible: false
  }, {
    field: 'POCorg',
    title: 'POC Org',
    sortable: true,
    visible: false
  }, {
    field: 'Comments',
    title: 'Comments',
    sortable: true
  }, {
    field: 'ApprovalExpirationDate',
    title: 'Approval Expiration Date',
    sortable: true,
    visible: false
  }];

  ngOnInit(): void {
    // Enable popovers
    $(function () {
      $('[data-toggle="popover"]').popover()
    });

    this.sharedService.setJWTonLogIn();

    $('#itStandardsTable').bootstrapTable($.extend(this.tableOptions, {
      columns: this.columnDefs,
      data: [],
    }));

    // Method to handle click events on the Investments table
    $(document).ready(
      $('#itStandardsTable').on('click-row.bs.table', function (e, row) {
        this.tableService.itStandTableClick(row);

        // Change URL to include ID
        var normalizedURL = this.sharedService.coreURL(this.router.url);
        this.location.replaceState(`${normalizedURL}/${row.ID}`);
      }.bind(this))
    );

    // Method to open details modal when referenced directly via URL
    this.route.params.subscribe(params => {
      var detailStandID = params['standardID'];
      if (detailStandID) {
        this.apiService.getOneITStandard(detailStandID).subscribe((data: any[]) => {
          this.tableService.itStandTableClick(data[0]);
        });
      };
    });

  }


  // Create new IT Standard when in GEAR Manager mode
  createITStand() {
    var emptyITStand = new ITStandards();

    // By default, set new record status to "Pilot"
    emptyITStand.Status = 'Pilot';
    this.modalService.updateRecordCreation(true);
    this.sharedService.setITStandardsForm();
    this.modalService.updateDetails(emptyITStand, 'it-standard');
    $('#itStandardsManager').modal('show');
  }

  // Update table from filter buttons
  changeFilter(field: string, term: string) {
    this.filteredTable = true;  // Filters are on, expose main table button
    var filter = {};
    filter[field] = term;

    // Set cloud field to visible if filtering by cloud enabled
    $('#itStandardsTable').bootstrapTable('filterBy', filter);
    $('#itStandardsTable').bootstrapTable('refreshOptions', {
      exportOptions: {
        fileName: this.sharedService.fileNameFmt('GSA_' + term + '_IT_Standards')
      }
    });

    this.filterTitle = `${term} `;
  }

  backToMainIT() {
    this.filteredTable = false;  // Hide main button

    // Remove filters and back to default
    $('#itStandardsTable').bootstrapTable('filterBy', {});
    $('#itStandardsTable').bootstrapTable('refreshOptions', {
      exportOptions: {
        fileName: this.sharedService.fileNameFmt('GSA_IT_Standards')
      }
    });

    this.filterTitle = '';
  }

}
