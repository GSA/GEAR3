import { Component, OnInit } from '@angular/core';

import { ModalsService } from '@services/modals/modals.service';
import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';

import { Investment } from '@api/models/investments.model';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'investments',
  templateUrl: './investments.component.html',
  styleUrls: ['./investments.component.css']
})
export class InvestmentsComponent implements OnInit {

  row: Object = <any>{};
  filteredTable: boolean = false;

  single = [
    {
      "name": "FAS (Q)",
      "value": 38
    },
    {
      "name": "PBS (P)",
      "value": 23
    },
    {
      "name": "GSA IT (I)",
      "value": 15
    },
    {
      "name": "Gov'twide Policy (M)",
      "value": 15
    },
    {
      "name": "HRM (C)",
      "value": 6
    },
    {
      "name": "CFO (B)",
      "value": 6
    },
    {
      "name": "Admin Svcs (H)",
      "value": 3
    },
    {
      "name": "Inspct Gnrl (J)",
      "value": 1
    },
    {
      "name": "Deputy CIO (ID)",
      "value": 1
    }
  ];
  view: any[] = [];
  label: string = 'Total Investments'

  // options
  gradient: boolean = true;
  showLegend: boolean = true;
  showLabels: boolean = true;
  isDoughnut: boolean = false;

  colorScheme = {
    domain: ['#5AA454', '#E44D25', '#CFC0BB', '#7aa3e5', '#a8385d', '#aae3f5']
  };

  constructor(
    private modalService: ModalsService,
    public sharedService: SharedService,
    private tableService: TableService) {
    this.modalService.currentInvest.subscribe(row => this.row = row);
  }

  // Investment Table Options
  tableOptions: {} = this.tableService.createTableOptions({
    advancedSearch: true,
    idTable: 'InvestTable',
    classes: "table-hover table-dark clickable-table",
    showColumns: true,
    showExport: true,
    exportFileName: 'GSA_IT_Investments',
    headerStyle: "bg-success",
    pagination: true,
    search: true,
    sortName: 'Name',
    sortOrder: 'asc',
    showToggle: true,
    url: this.sharedService.internalURLFmt('/api/investments')
  });

  // Investments Table Columns
  columnDefs: any[] = [{
    field: 'Name',
    title: 'Investment Name',
    sortable: true
  }, {
    field: 'Description',
    title: 'Description',
    sortable: true,
    class: 'text-truncate'
  }, {
    field: 'Type',
    title: 'Type',
    sortable: true
  }, {
    field: 'InvManager',
    title: 'Investment Manager',
    sortable: true
  }, {
    field: 'SSO',
    title: 'SSO',
    sortable: true
  }, {
    field: 'PSA',
    title: 'Primary Service Area',
    sortable: true
  }, {
    field: 'SSA',
    title: 'Secondary Service Area',
    sortable: true,
    visible: false
  }, {
    field: 'UII',
    title: 'Investment UII',
    sortable: true,
    visible: false
  }];

  ngOnInit(): void {
    // Enable popovers
    $(function () {
      $('[data-toggle="popover"]').popover()
    })

    $('#investTable').bootstrapTable($.extend(this.tableOptions, {
      columns: this.columnDefs,
      data: [],
    }));

    // Filter to only active investments
    $(document).ready(
      $('#investTable').bootstrapTable('filterBy', { Active: 'True' })
    );

    // Method to handle click events on the Investments table
    $(document).ready(
      $('#investTable').on('click-row.bs.table', function (e, row) {
        this.tableService.investTableClick(row);
      }.bind(this))
    );

  }


  // Create new investment when in GEAR Manager mode
  createInvestment() {
    var emptyInvestment = new Investment();

    // By default, set new record to active
    emptyInvestment.Active = true;
    this.modalService.updateRecordCreation(true);
    this.sharedService.setInvestForm();
    this.modalService.updateDetails(emptyInvestment, 'investment');
    $('#investManager').modal('show');
  }

  // Update table from filter buttons
  inactiveFilter() {
    this.filteredTable = true;  // Filters are on, expose main table button

    $('#investTable').bootstrapTable('filterBy', { Active: 'False' });
    $('#investTable').bootstrapTable('refreshOptions', {
      exportOptions: {
        fileName: this.sharedService.fileNameFmt('GSA_Inactive_IT_Investments')
      }
    })
  }

  backToMainInvest() {
    this.filteredTable = false;  // Hide main button

    // Remove filters and back to default
    $('#investTable').bootstrapTable('filterBy', { Active: 'True' });
    $('#investTable').bootstrapTable('refreshOptions', {
      exportOptions: {
        fileName: this.sharedService.fileNameFmt('GSA_IT_Investments')
      }
    });
  }

  onSelect(data): void {
    console.log('Item clicked', JSON.parse(JSON.stringify(data)));
  }

  onActivate(data): void {
    console.log('Activate', JSON.parse(JSON.stringify(data)));
  }

  onDeactivate(data): void {
    console.log('Deactivate', JSON.parse(JSON.stringify(data)));
  }

}
