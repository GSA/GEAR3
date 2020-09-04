import { Component, OnInit } from '@angular/core';

import { ApiService } from '@services/apis/api.service';
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
  tableTitle: string = '';

  vizData: any[] = [];
  vizLabel: string = 'Total Active Investments'
  colorScheme: {} = {
    domain: ['#5AA454', '#E44D25', '#CFC0BB', '#7aa3e5', '#a8385d', '#aae3f5']
  };

  constructor(
    private apiService: ApiService,
    private modalService: ModalsService,
    public sharedService: SharedService,
    private tableService: TableService) {
    this.modalService.currentInvest.subscribe(row => this.row = row);
  }

  // Investment Table Options
  tableOptions: {} = this.tableService.createTableOptions({
    advancedSearch: true,
    idTable: 'InvestTable',
    classes: "table-hover table-dark clickable-table fixed-table",
    showColumns: true,
    showExport: true,
    exportFileName: 'GSA_IT_Investments',
    headerStyle: "bg-success",
    pagination: true,
    search: true,
    sortName: 'Name',
    sortOrder: 'asc',
    showToggle: true,
    url: this.apiService.investUrl
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
    field: 'SSOShort',
    title: 'SSO (Short)',
    sortable: true,
    visible: false
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

    // Get Investment data for visuals
    this.apiService.getInvestments().subscribe((data: any[]) => {
      // Get counts by SSO
      var counts = data.reduce((p, c) => {
        var name = c.SSOShort;
        if (!p.hasOwnProperty(name)) {
          p[name] = 0;
        }
        // Only count if Active
        if (c.Active === 'True') p[name]++;
        return p;
      }, {});

      // Resolve the counts into an object and sort by value
      this.vizData = Object.keys(counts).map(k => {
        return { name: k, value: counts[k] };
      })
        .sort(function(a, b) {
          return b.value - a.value;
      });
    });


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
    this.tableTitle = 'Inactive';

    // Hide visualization when on inactive items
    $('#investViz').collapse('hide');

    $('#investTable').bootstrapTable('filterBy', { Active: 'False' });
    $('#investTable').bootstrapTable('refreshOptions', {
      exportOptions: {
        fileName: this.sharedService.fileNameFmt('GSA_Inactive_IT_Investments')
      }
    })
  }

  backToMainInvest() {
    this.filteredTable = false;  // Hide main button
    this.tableTitle = '';

    $('#investViz').collapse('show');

    // Remove filters and back to default
    $('#investTable').bootstrapTable('filterBy', { Active: 'True' });
    $('#investTable').bootstrapTable('refreshOptions', {
      exportOptions: {
        fileName: this.sharedService.fileNameFmt('GSA_IT_Investments')
      }
    });
  }

  onSelect(chartData): void {
    this.filteredTable = true;  // Filters are on, expose main table button
    this.tableTitle = chartData.name;

    // Filter by SSO clicked on visualization
    $('#investTable').bootstrapTable('filterBy', {
      Active: 'True',
      SSOShort: chartData.name
    });
    $('#investTable').bootstrapTable('refreshOptions', {
      exportOptions: {
        fileName: this.sharedService.fileNameFmt('GSA_IT_Investments-' + chartData.name)
      }
    });
  }
}
