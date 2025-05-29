import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { colorSets } from '@swimlane/ngx-charts';

import { ApiService } from '@services/apis/api.service';
import { ModalsService } from '@services/modals/modals.service';
import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';
import { Title } from '@angular/platform-browser';

// Declare jQuery symbol
declare var $: any;

@Component({
    selector: 'time',
    templateUrl: './time.component.html',
    styleUrls: ['./time.component.css'],
    standalone: false
})
export class TimeComponent implements OnInit {
  row: Object = <any>{};

  vizData: any[] = [];

  // options
  animations: boolean = true;
  showLegend: boolean = true;
  legendTitle: string = 'TIME Value';
  showXAxis: boolean = true;
  showXAxisLabel: boolean = true;
  xAxisLabel: string = 'Fiscal Year';
  showYAxis: boolean = true;
  showYAxisLabel: boolean = true;
  yAxisLabel: string = '# of Systems';
  colorSets: any;

  colorScheme: any;

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
    this.modalService.currentSys.subscribe((row) => (this.row = row));

    Object.assign(this, {
      colorSets,
    });
  }

  // TIME Table Options
  tableOptions: {} = this.tableService.createTableOptions({
    advancedSearch: true,
    idTable: 'TimeTable',
    classes: 'table-hover table-dark clickable-table',
    showColumns: true,
    showExport: true,
    exportFileName: 'Systems_TIME_Report',
    headerStyle: 'bg-danger',
    pagination: true,
    search: true,
    sortName: 'Name',
    sortOrder: 'asc',
    showToggle: true,
    url: this.apiService.timeUrl,
  });

  // TIME Table Columns
  columnDefs: any[] = [
    {
      field: 'System Name',
      title: 'System Name',
      sortable: true,
    },
    {
      field: 'FY',
      title: 'FY',
      sortable: true,
    },
    {
      field: 'TIME Designation',
      title: 'TIME Designation',
      sortable: true,
    },
    {
      field: 'Business Score',
      title: 'Business Score',
      visible: false,
      sortable: true,
    },
    {
      field: 'Technical Score',
      title: 'Technical Score',
      visible: false,
      sortable: true,
    },
    {
      field: 'O&M Cost',
      title: 'O&M Cost',
      visible: false,
      sortable: true,
    },
    {
      field: 'DM&E Cost',
      title: 'DM&E Cost',
      visible: false,
      sortable: true,
    },
    {
      field: 'Software/Hardware License Costs',
      title: 'License Costs',
      visible: false,
      sortable: true,
    },
    {
      field: 'Questionnaire Last Updated',
      title: 'Questionnaire Last Updated',
      sortable: true,
      visible: false,
      formatter: this.sharedService.dateFormatter,
    },
    {
      field: 'POC Last Updated',
      title: 'POC of Last Updated',
      sortable: true,
      visible: false,
      formatter: this.sharedService.emailFormatter,
    },
    {
      field: 'File Link',
      title: 'File Link',
      sortable: true,
      visible: false,
      formatter: this.sharedService.linksFormatter,
    },
    {
      field: 'System Id',
      title: 'System Id',
      sortable: false,
      visible: false
    }
  ];

  ngOnInit(): void {
    // Enable popovers
    $(function () {
      $('[data-bs-toggle="popover"]').popover();
    });

    $('#timeTable').bootstrapTable(
      $.extend(this.tableOptions, {
        columns: this.columnDefs,
        data: [],
      })
    );

    const self = this;
    $(document).ready(() => {
      // Method to handle click events on the Systems table
      $('#timeTable').on('click-row.bs.table', function (e, row, $element, field) {    
        if (field !== 'File Link' ) {
          // Grab data for system by name
          this.apiService
            .getOneSys(row['System Id'])
            .subscribe((data: any[]) => {
              this.tableService.systemsTableClick(data[0]);
            });

          // Change URL to include ID
          this.sharedService.addIDtoURL(row, 'Id');
        }     
      }.bind(this));

      //Enable table sticky header
      self.sharedService.enableStickyHeader("timeTable");
  });

    // Visualization data
    this.apiService.getTIME().subscribe((data: any[]) => {
      var yearTimeCount = {};

      // Count number of each TIME value for each FY
      data.forEach((row) => {
        let year = row['FY'];
        let timeVal = row['TIME Designation'];

        if (!(year in yearTimeCount)) yearTimeCount[year] = {}; // If year does not exist, add it
        if (!(timeVal in yearTimeCount[year])) yearTimeCount[year][timeVal] = 1;
        // If time value for year does not exist, initialize to 1
        else yearTimeCount[year][timeVal]++; // Else, increment time value for year by 1
      });

      // Layout counts to form to be ingested to visual
      for (const [fy, timeCount] of Object.entries(yearTimeCount).sort()) {
        let dataPoint = {};

        dataPoint['name'] = fy;
        dataPoint['series'] = [];

        for (const [timeVal, count] of Object.entries(timeCount).sort()) {
          let obj = {};

          obj['name'] = timeVal;
          obj['value'] = count;

          dataPoint['series'].push(obj);
        }
        this.vizData.push(dataPoint);
      }

      // For change detection to render chart after data has been processed
      this.vizData = [...this.vizData];

      // Set color scheme for chart
      this.colorScheme = this.colorSets.find((s) => s.name === 'vivid');

      // console.log(this.vizData);  // Debug
    });

    // Method to open details modal when referenced directly via URL
    this.route.params.subscribe((params) => {
      var detailSysID = params['sysID'];
      if (detailSysID) {
        this.titleService.setTitle(
          `${this.titleService.getTitle()} - ${detailSysID}`
        );
        this.apiService.getOneSys(detailSysID).subscribe((data: any[]) => {
          this.tableService.systemsTableClick(data[0]);
          // this.getInterfaceData(row.ID);
        });
      }
    });
  }

  onSelect(event) {
    console.log(event);
  }
}