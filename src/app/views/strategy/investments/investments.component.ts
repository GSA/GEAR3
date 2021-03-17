import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

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
  filterTitle: string = '';
  nonEliminatedTypes: any[] = ['No change in status', 'New'];
  eliminatedTypes: any[] = ['Eliminated by funding', 'Eliminated by omission'];

  vizData: any[] = [];
  vizLabel: string = 'Total Non-Eliminated Investments'
  colorScheme: {} = {
    domain: ['#5AA454', '#E44D25', '#CFC0BB', '#7aa3e5', '#a8385d', '#aae3f5']
  };

  constructor(
    private apiService: ApiService,
    private location: Location,
    private modalService: ModalsService,
    private route: ActivatedRoute,
    private router: Router,
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
    field: 'IT_Portfolio',
    title: 'Part of IT Portfolio',
    sortable: true
  }, {
    field: 'Budget_Year',
    title: 'Budget Year',
    sortable: true
  }, {
    field: 'InvManager',
    title: 'Investment Manager',
    sortable: true
  }, {
    field: 'Status',
    title: 'Status',
    sortable: true
  }, {
    field: 'Start_Year',
    title: 'Start Year',
    sortable: true,
    visible: false
  }, {
    field: 'End_Year',
    title: 'End Year',
    sortable: true,
    visible: false
  }, {
    field: 'PSA',
    title: 'Primary Service Area',
    sortable: true,
    visible: false
  }, {
    field: 'Cloud_Alt',
    title: 'Cloud Alt. Evaluation',
    sortable: true,
    visible: false
  }, {
    field: 'Comments',
    title: 'Comments',
    sortable: true,
    visible: false
  }, {
    field: 'UII',
    title: 'Investment UII',
    sortable: true,
    visible: false
  }, {
    field: 'Updated_Date',
    title: 'Updated Date',
    sortable: true
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

    // Filter to only non-eliminated investments
    $(document).ready(
      $('#investTable').bootstrapTable('filterBy', { Status: this.nonEliminatedTypes })
    );

    // Method to handle click events on the Investments table
    $(document).ready(
      $('#investTable').on('click-row.bs.table', function (e, row) {
        this.tableService.investTableClick(row);

        // Change URL to include ID
        var normalizedURL = this.sharedService.coreURL(this.router.url);
        this.location.replaceState(`${normalizedURL}/${row.ID}`);
      }.bind(this))
    );

    // Get Investment data for visuals
    this.apiService.getInvestments().subscribe((data: any[]) => {
      // Get counts by Investment Type
      var counts = data.reduce((p, c) => {
        var name = c.Type;
        if (!p.hasOwnProperty(name)) {
          p[name] = 0;
        }
        // Only count if not eliminated
        if (c.Status.includes('Eliminated') == false) p[name]++;
        return p;
      }, {});

      // Resolve the counts into an object and sort by value
      this.vizData = Object.keys(counts).map(k => {
        return { name: k, value: counts[k] };
      })
        .sort(function (a, b) {
          return b.value - a.value;
        });

      // console.log(this.vizData);  // Debug
    });

    // Method to open details modal when referenced directly via URL
    this.route.params.subscribe(params => {
      var detailInvestID = params['investID'];
      if (detailInvestID) {
        this.apiService.getOneInvest(detailInvestID).subscribe((data: any[]) => {
          this.tableService.investTableClick(data[0]);
        });
      };
    });

  }


  // Create new investment when in GEAR Manager mode
  // createInvestment() {
  //   var emptyInvestment = new Investment();

  //   // By default, set new record to active
  //   emptyInvestment.Active = true;
  //   this.modalService.updateRecordCreation(true);
  //   this.sharedService.setInvestForm();
  //   this.modalService.updateDetails(emptyInvestment, 'investment');
  //   $('#investManager').modal('show');
  // }

  // Update table from filter buttons
  eliminatedFilter() {
    this.filteredTable = true;  // Filters are on, expose main table button
    this.filterTitle = 'Eliminated';

    // Hide visualization when on eliminated items
    $('#investViz').collapse('hide');

    $('#investTable').bootstrapTable('filterBy', { Status: this.eliminatedTypes });
    $('#investTable').bootstrapTable('refreshOptions', {
      exportOptions: {
        fileName: this.sharedService.fileNameFmt('GSA_Eliminated_IT_Investments')
      }
    })
  }

  backToMainInvest() {
    this.filteredTable = false;  // Hide main button
    this.filterTitle = '';

    $('#investViz').collapse('show');

    // Remove filters and back to default
    $('#investTable').bootstrapTable('filterBy', { Status: this.nonEliminatedTypes });
    $('#investTable').bootstrapTable('refreshOptions', {
      exportOptions: {
        fileName: this.sharedService.fileNameFmt('GSA_IT_Investments')
      }
    });
  }

  onSelect(chartData): void {
    this.filteredTable = true;  // Filters are on, expose main table button
    this.filterTitle = chartData.name;

    // Filter by Type clicked on visualization
    $('#investTable').bootstrapTable('filterBy', {
      Status: this.nonEliminatedTypes,
      Type: chartData.name
    });
    $('#investTable').bootstrapTable('refreshOptions', {
      exportOptions: {
        fileName: this.sharedService.fileNameFmt('GSA_IT_Investments-' + chartData.name)
      }
    });
  }
}
