import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { ApiService } from '@services/apis/api.service';
import { ModalsService } from '@services/modals/modals.service';
import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';
import { Title } from '@angular/platform-browser';

import { Investment } from '@api/models/investments.model';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'investments',
  templateUrl: './investments.component.html',
  styleUrls: ['./investments.component.css'],
})
export class InvestmentsComponent implements OnInit {
  row: Object = <any>{};
  filteredTable: boolean = false;
  filterTitle: string = '';
  nonEliminatedTypes: any[] = ['11: No Change in Status', '10: New', '01: Upgraded from non-major to major IT Investment', '04: Consolidation of Investments'];
  eliminatedTypes: any[] = ['06: Eliminated by funding', 'Eliminated by omission', '09: Eliminated by reorganization'];

  vizData: any[] = [];
  vizLabel: string = 'Total Current IT Investments';
  colorScheme: {} = {
    domain: ['#5AA454', '#E44D25', '#CFC0BB', '#7aa3e5', '#a8385d', '#aae3f5'],
  };

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
    this.modalService.currentInvest.subscribe((row) => (this.row = row));
  }

  // Investment Table Options
  tableOptions: {} = this.tableService.createTableOptions({
    advancedSearch: true,
    idTable: 'InvestTable',
    classes: 'table-hover table-dark clickable-table',
    showColumns: true,
    showExport: true,
    exportFileName: 'GSA_IT_Investments',
    headerStyle: 'bg-success',
    pagination: true,
    search: true,
    sortName: 'Name',
    sortOrder: 'asc',
    showToggle: true,
    url: this.apiService.investUrl,
  });

  // Investments Main Table Columns
  columnDefs: any[] = [
    {
      field: 'Name',
      title: 'Investment Name',
      sortable: true,
    },
    {
      field: 'Description',
      title: 'Description',
      sortable: true,
      visible: false,
      class: 'text-truncate',
    },
    {
      field: 'Type',
      title: 'Type',
      sortable: true,
    },
    {
      field: 'IT_Portfolio',
      title: 'Part of IT Portfolio',
      sortable: true,
    },
    {
      field: 'Budget_Year',
      title: 'Budget Year',
      sortable: true,
    },
    {
      field: 'InvManager',
      title: 'Investment Manager',
      sortable: true,
      formatter: this.sharedService.noneProvidedFormatter,
    },
    {
      field: 'Status',
      title: 'Status',
      sortable: true,
    },
    {
      field: 'Start_Year',
      title: 'Start Year',
      sortable: true,
      visible: false,
    },
    {
      field: 'End_Year',
      title: 'End Year',
      sortable: true,
      visible: false,
    },
    {
      field: 'PSA',
      title: 'Primary Service Area',
      sortable: true,
      visible: false,
    },
    {
      field: 'Cloud_Alt',
      title: 'Cloud Alt. Evaluation',
      sortable: true,
      visible: false,
    },
    {
      field: 'Comments',
      title: 'Comments',
      sortable: true,
      visible: false,
    },
    {
      field: 'UII',
      title: 'Investment UII',
      sortable: true,
      visible: false,
    },
    {
      field: 'Updated_Date',
      title: 'Updated Date',
      sortable: true,
      visible: false,
      formatter: this.sharedService.dateFormatter,
    },
  ];

  // Previous Year Investments Table Columns
  PYcolumnDefs: any[] = [
    {
      field: 'UII',
      title: 'Investment UII',
      sortable: true,
      visible: false,
    },
    {
      field: 'Name',
      title: 'Investment Name',
      sortable: true,
    },
    {
      field: 'Total_Spend_PY',
      title: 'Total IT Spending ($ M): PY',
      sortable: true,
    },
    {
      field: 'DME_Agency_Fund_PY',
      title: 'DME Agency Funding ($ M): PY',
      sortable: true,
    },
    {
      field: 'DME_Contributions_PY',
      title: 'DME Contributions ($ M): PY',
      sortable: true,
    },
    {
      field: 'OnM_Agency_Fund_PY',
      title: 'O&M Agency Funding ($ M): PY',
      sortable: true,
    },
    {
      field: 'OnM_Contributions_PY',
      title: 'O&M Contributions ($ M): PY',
      sortable: true,
    },
  ];

  // Current Year Investments Table Columns
  CYcolumnDefs: any[] = [
    {
      field: 'UII',
      title: 'Investment UII',
      sortable: true,
      visible: false,
    },
    {
      field: 'Name',
      title: 'Investment Name',
      sortable: true,
    },
    {
      field: 'Total_Spend_CY',
      title: 'Total IT Spending ($ M): CY',
      sortable: true,
    },
    {
      field: 'DME_Agency_Fund_CY',
      title: 'DME Agency Funding ($ M): CY',
      sortable: true,
    },
    {
      field: 'DME_Contributions_CY',
      title: 'DME Contributions ($ M): CY',
      sortable: true,
    },
    {
      field: 'OnM_Agency_Fund_CY',
      title: 'O&M Agency Funding ($ M): CY',
      sortable: true,
    },
    {
      field: 'OnM_Contributions_CY',
      title: 'O&M Contributions ($ M): CY',
      sortable: true,
    },
  ];

  // Budget Year Investments Table Columns
  BYcolumnDefs: any[] = [
    {
      field: 'UII',
      title: 'Investment UII',
      sortable: true,
      visible: false,
    },
    {
      field: 'Name',
      title: 'Investment Name',
      sortable: true,
    },
    {
      field: 'Total_Spend_BY',
      title: 'Total IT Spending ($ M): BY',
      sortable: true,
    },
    {
      field: 'DME_Agency_Fund_BY',
      title: 'DME Agency Funding ($ M): BY',
      sortable: true,
    },
    {
      field: 'DME_Contributions_BY',
      title: 'DME Contributions ($ M): BY',
      sortable: true,
    },
    {
      field: 'DME_Budget_Auth_BY',
      title: 'DME Budget Authority Agency Funding ($ M): BY',
      sortable: true,
    },
    {
      field: 'OnM_Agency_Fund_BY',
      title: 'O&M Agency Funding ($ M): BY',
      sortable: true,
    },
    {
      field: 'OnM_Contributions_BY',
      title: 'O&M Contributions ($ M): BY',
      sortable: true,
    },
    {
      field: 'OnM_Budget_Auth_BY',
      title: 'O&M Budget Authority Agency Funding ($ M): BY',
      sortable: true,
    },
  ];

  ngOnInit(): void {
    // Enable popovers
    $(function () {
      $('[data-toggle="popover"]').popover();
    });

    $('#investTable').bootstrapTable(
      $.extend(this.tableOptions, {
        columns: this.columnDefs,
        data: [],
      })
    );

    // Filter to only non-eliminated investments
    $(document).ready(
      $('#investTable').bootstrapTable('filterBy', {
        Status: this.nonEliminatedTypes,
      })
    );

    // Method to handle click events on the Investments table
    $(document).ready(
      $('#investTable').on(
        'click-row.bs.table',
        function (e, row) {
          this.tableService.investTableClick(row);
        }.bind(this)
      )
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
      this.vizData = Object.keys(counts)
        .map((k) => {
          return { name: k, value: counts[k] };
        })
        .sort(function (a, b) {
          return b.value - a.value;
        });

      // console.log(this.vizData);  // Debug
    });

    // Method to open details modal when referenced directly via URL
    this.route.params.subscribe((params) => {
      var detailInvestID = params['investID'];
      if (detailInvestID) {
        this.titleService.setTitle(
          `${this.titleService.getTitle()} - ${detailInvestID}`
        );
        this.apiService
          .getOneInvest(detailInvestID)
          .subscribe((data: any[]) => {
            this.tableService.investTableClick(data[0]);
          });
      }
    });
  }

  getAriaLabel(data: { name: string, value: number }[]): string {
    const total = data.reduce((acc, cur) => acc + cur.value, 0);
    if (data.length === 1) {
      return `Pie chart representing ${total} total IT investments, all of which are ${data[0].value} ${data[0].name}`;
    } else {
      const labels = data.map(item => `${Math.round((item.value / total) * 100)}% are ${item.name}`).join(', ');
      return `Pie chart representing ${total} total IT investments, of which ${labels}}`;
    }
  }

  // Update table from filter buttons
  eliminatedFilter() {
    this.filteredTable = true; // Filters are on, expose main table button
    this.filterTitle = 'Eliminated';

    // Hide visualization when on eliminated items
    $('#investViz').collapse('hide');

    $('#investTable').bootstrapTable('filterBy', {
      Status: this.eliminatedTypes,
    });
    $('#investTable').bootstrapTable('refreshOptions', {
      exportOptions: {
        fileName: this.sharedService.fileNameFmt(
          'GSA_Eliminated_IT_Investments'
        ),
      },
    });
  }

  previousYearFilter() {
    this.filteredTable = true; // Filters are on, expose main table button
    this.filterTitle = 'Previous Year';

    // Hide visualization
    $('#investViz').collapse('hide');

    $('#investTable').bootstrapTable('filterBy', {});
    $('#investTable').bootstrapTable('refreshOptions', {
      columns: this.PYcolumnDefs,
      exportOptions: {
        fileName: this.sharedService.fileNameFmt(
          'GSA_Previous_Year_IT_Investments'
        ),
      },
    });
  }

  currentYearFilter() {
    this.filteredTable = true; // Filters are on, expose main table button
    this.filterTitle = 'Current Year';

    // Hide visualization when on eliminated items
    $('#investViz').collapse('hide');

    $('#investTable').bootstrapTable('filterBy', {});
    $('#investTable').bootstrapTable('refreshOptions', {
      columns: this.CYcolumnDefs,
      exportOptions: {
        fileName: this.sharedService.fileNameFmt(
          'GSA_Current_Year_IT_Investments'
        ),
      },
    });
  }

  budgetYearFilter() {
    this.filteredTable = true; // Filters are on, expose main table button
    this.filterTitle = 'Budget Year';

    // Hide visualization
    $('#investViz').collapse('hide');

    $('#investTable').bootstrapTable('filterBy', {});
    $('#investTable').bootstrapTable('refreshOptions', {
      columns: this.BYcolumnDefs,
      exportOptions: {
        fileName: this.sharedService.fileNameFmt(
          'GSA_Budget_Year_IT_Investments'
        ),
      },
    });
  }

  backToMainInvest() {
    this.filteredTable = false; // Hide main button
    this.filterTitle = '';

    $('#investViz').collapse('show');

    // Remove filters and back to default
    $('#investTable').bootstrapTable('filterBy', {
      Status: this.nonEliminatedTypes,
    });
    $('#investTable').bootstrapTable('refreshOptions', {
      columns: this.columnDefs,
      exportOptions: {
        fileName: this.sharedService.fileNameFmt('GSA_IT_Investments'),
      },
    });
  }

  onSelect(chartData): void {
    this.filteredTable = true; // Filters are on, expose main table button
    this.filterTitle = chartData.name;

    // Filter by Type clicked on visualization
    $('#investTable').bootstrapTable('filterBy', {
      Status: this.nonEliminatedTypes,
      Type: chartData.name,
    });
    $('#investTable').bootstrapTable('refreshOptions', {
      exportOptions: {
        fileName: this.sharedService.fileNameFmt(
          'GSA_IT_Investments-' + chartData.name
        ),
      },
    });
  }
}
