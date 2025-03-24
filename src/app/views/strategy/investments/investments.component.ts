import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { ApiService } from '@services/apis/api.service';
import { ModalsService } from '@services/modals/modals.service';
import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';
import { Title } from '@angular/platform-browser';

import { Investment } from '@api/models/investments.model';
import { FilterButton, Column, TwoDimArray } from '../../../common/table-classes';

// Declare jQuery symbol
declare var $: any;

@Component({
    selector: 'investments',
    templateUrl: './investments.component.html',
    styleUrls: ['./investments.component.css'],
    standalone: false
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
    private modalService: ModalsService,
    private route: ActivatedRoute,
    public sharedService: SharedService,
    private tableService: TableService,
    private titleService: Title
  ) {
    this.modalService.currentInvest.subscribe((row) => (this.row = row));
  }

  tableData: Investment[] = [];
  tableDataOriginal: Investment[] = [];

  preloadedFilterButtons: FilterButton[] = [];
  filterButtons: TwoDimArray<FilterButton> = [
    [
      {
        buttonText: 'Eliminated',
        filters: [
          { field: 'Status', value: 'eliminated', matchMode: 'contains' }
        ]
      },
      {
        buttonText: 'Previous Year $',
        filters: []
      },
      {
        buttonText: 'Current Year $',
        filters: []
      },
      {
        buttonText: 'Budget Year $',
        filters: []
      }
    ]
  ];

  tableCols: Column[] = [];

  defaultCols: Column[] = [
    {
      field: 'Name',
      header: 'Investment Name',
      isSortable: true,
    },
    {
      field: 'Description',
      header: 'Description',
      isSortable: true,
      showColumn: true,
      formatter: this.sharedService.formatDescription
    },
    {
      field: 'Type',
      header: 'Type',
      isSortable: true,
    },
    {
      field: 'IT_Portfolio',
      header: 'Part of IT Portfolio',
      isSortable: true,
    },
    {
      field: 'Budget_Year',
      header: 'Budget Year',
      isSortable: true,
    },
    {
      field: 'InvManager',
      header: 'Investment Manager',
      isSortable: true,
      formatter: this.sharedService.noneProvidedFormatter,
    },
    {
      field: 'Status',
      header: 'Status',
      isSortable: true,
    },
    {
      field: 'Start_Year',
      header: 'Start Year',
      isSortable: true,
      showColumn: false,
    },
    {
      field: 'End_Year',
      header: 'End Year',
      isSortable: true,
      showColumn: false,
    },
    {
      field: 'PSA',
      header: 'Primary Service Area',
      isSortable: true,
      showColumn: false,
    },
    {
      field: 'Cloud_Alt',
      header: 'Cloud Alt. Evaluation',
      isSortable: true,
      showColumn: false,
    },
    {
      field: 'Comments',
      header: 'Comments',
      isSortable: true,
      showColumn: false,
    },
    {
      field: 'UII',
      header: 'Investment UII',
      isSortable: true,
      showColumn: false,
    },
    {
      field: 'Updated_Date',
      header: 'Updated Date',
      isSortable: true,
      showColumn: false,
      formatter: this.sharedService.dateFormatter,
    },
  ];

  // Previous Year Investments Table Columns
  PYcolumnDefs: Column[] = [
    {
      field: 'UII',
      header: 'Investment UII',
      isSortable: true,
      showColumn: false,
    },
    {
      field: 'Name',
      header: 'Investment Name',
      isSortable: true,
    },
    {
      field: 'Total_Spend_PY',
      header: 'Total IT Spending ($ M): PY',
      isSortable: true,
    },
    {
      field: 'DME_Agency_Fund_PY',
      header: 'DME Agency Funding ($ M): PY',
      isSortable: true,
    },
    {
      field: 'DME_Contributions_PY',
      header: 'DME Contributions ($ M): PY',
      isSortable: true,
    },
    {
      field: 'OnM_Agency_Fund_PY',
      header: 'O&M Agency Funding ($ M): PY',
      isSortable: true,
    },
    {
      field: 'OnM_Contributions_PY',
      header: 'O&M Contributions ($ M): PY',
      isSortable: true,
    },
  ];

  // Current Year Investments Table Columns
  CYcolumnDefs: Column[] = [
    {
      field: 'UII',
      header: 'Investment UII',
      isSortable: true,
      showColumn: false,
    },
    {
      field: 'Name',
      header: 'Investment Name',
      isSortable: true,
    },
    {
      field: 'Total_Spend_CY',
      header: 'Total IT Spending ($ M): CY',
      isSortable: true,
    },
    {
      field: 'DME_Agency_Fund_CY',
      header: 'DME Agency Funding ($ M): CY',
      isSortable: true,
    },
    {
      field: 'DME_Contributions_CY',
      header: 'DME Contributions ($ M): CY',
      isSortable: true,
    },
    {
      field: 'OnM_Agency_Fund_CY',
      header: 'O&M Agency Funding ($ M): CY',
      isSortable: true,
    },
    {
      field: 'OnM_Contributions_CY',
      header: 'O&M Contributions ($ M): CY',
      isSortable: true,
    },
  ];

  // Budget Year Investments Table Columns
  BYcolumnDefs: Column[] = [
    {
      field: 'UII',
      header: 'Investment UII',
      isSortable: true,
      showColumn: false,
    },
    {
      field: 'Name',
      header: 'Investment Name',
      isSortable: true,
    },
    {
      field: 'Total_Spend_BY',
      header: 'Total IT Spending ($ M): BY',
      isSortable: true,
    },
    {
      field: 'DME_Agency_Fund_BY',
      header: 'DME Agency Funding ($ M): BY',
      isSortable: true,
    },
    {
      field: 'DME_Contributions_BY',
      header: 'DME Contributions ($ M): BY',
      isSortable: true,
    },
    {
      field: 'DME_Budget_Auth_BY',
      header: 'DME Budget Authority Agency Funding ($ M): BY',
      isSortable: true,
    },
    {
      field: 'OnM_Agency_Fund_BY',
      header: 'O&M Agency Funding ($ M): BY',
      isSortable: true,
    },
    {
      field: 'OnM_Contributions_BY',
      header: 'O&M Contributions ($ M): BY',
      isSortable: true,
    },
    {
      field: 'OnM_Budget_Auth_BY',
      header: 'O&M Budget Authority Agency Funding ($ M): BY',
      isSortable: true,
    },
  ];

  ngOnInit(): void {
    // Enable popovers
    $(function () {
      $('[data-toggle="popover"]').popover();
    });

    this.tableCols = this.defaultCols;

    this.apiService.getInvestments().subscribe(i => {
      this.tableService.updateReportTableData(i);
      this.tableData = i;
      this.tableDataOriginal = i;
    });

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

  onFilterEvent(filter: string) {
    if(filter === 'Eliminated') {
      this.tableCols = this.defaultCols;
      // Hide visualization
      $('#investViz').collapse('hide');
    } else if(filter === 'Previous Year $') {
      this.tableCols = this.PYcolumnDefs;
      // Hide visualization
      $('#investViz').collapse('hide');
    } else if(filter === 'Current Year $') {
      this.tableCols = this.CYcolumnDefs;
      // Hide visualization
      $('#investViz').collapse('hide');
    } else if(filter === 'Budget Year $') {
      this.tableCols = this.BYcolumnDefs;
      // Hide visualization
      $('#investViz').collapse('hide');
    } else {
      this.tableCols = this.defaultCols;
      // Show visualization
      $('#investViz').collapse('show');
    }
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

  onSelect(chartData): void {
    this.sharedService.disableStickyHeader("investTable");
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
    this.sharedService.enableStickyHeader("investTable");
  }

  onFilterClick(filterButtons: FilterButton[]) {
    this.tableData = this.tableDataOriginal;
    // this.tableService.filterButtonClick(filterButtons, this.tableData);
    filterButtons.forEach(f => {
      if(f.filters &&  f.filters.length > 0) {
        this.tableService.filterButtonClick(filterButtons, this.tableData);
      }
      this.onFilterEvent(f.buttonText);
    });
  }

  onFilterResetClick() {
    $('#investViz').collapse('show');
    this.tableCols = this.defaultCols;
    this.tableData = this.tableDataOriginal;
    this.tableService.updateReportTableData(this.tableDataOriginal);
  }
}
