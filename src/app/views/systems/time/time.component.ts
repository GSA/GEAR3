import { Component, OnInit } from '@angular/core';

import { colorSets } from '@swimlane/ngx-charts/esm5/lib/utils/color-sets';

import { ApiService } from '@services/apis/api.service';
import { ModalsService } from '@services/modals/modals.service';
import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'time',
  templateUrl: './time.component.html',
  styleUrls: ['./time.component.css']
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
    private modalService: ModalsService,
    private sharedService: SharedService,
    private tableService: TableService) {
    this.modalService.currentSys.subscribe(row => this.row = row);

    Object.assign(this, {
      colorSets
    });
  }

  // TIME Table Options
  tableOptions: {} = this.tableService.createTableOptions({
    advancedSearch: true,
    idTable: 'TimeTable',
    classes: "table-hover table-dark clickable-table",
    showColumns: true,
    showExport: true,
    exportFileName: 'Sysems_TIME_Report',
    headerStyle: "bg-danger",
    pagination: true,
    search: true,
    sortName: 'Name',
    sortOrder: 'asc',
    showToggle: true,
    url: this.apiService.timeUrl
  });

  // TIME Table Columns
  columnDefs: any[] = [{
    field: 'System Name',
    title: 'System Name',
    sortable: true
  }, {
    field: 'FY',
    title: 'FY',
    sortable: true
  }, {
    field: 'TIME Designation',
    title: 'TIME Designation',
    sortable: true
  }, {
    field: 'Business Score',
    title: 'Business Score',
    sortable: true
  }, {
    field: 'Technical Score',
    title: 'Technical Score',
    sortable: true
  }, {
    field: 'O&M Cost',
    title: 'O&M Cost',
    sortable: true
  }, {
    field: 'DM&E Cost',
    title: 'DM&E Cost',
    sortable: true
  }, {
    field: 'Software/Hardware License Costs',
    title: 'License Costs',
    sortable: true
  }, {
    field: 'Questionnaire Last Updated',
    title: 'Questionnaire Last Updated',
    sortable: true,
    formatter: this.sharedService.dateFormatter
  }, {
    field: 'POC Last Updated',
    title: 'POC of Last Updated',
    sortable: true,
    formatter: this.sharedService.emailFormatter
  }, {
    field: 'File Link',
    title: 'File Link',
    sortable: true,
    formatter: this.sharedService.linksFormatter
  }];

  ngOnInit(): void {
    // Enable popovers
    $(function () {
      $('[data-toggle="popover"]').popover()
    })

    $('#timeTable').bootstrapTable($.extend(this.tableOptions, {
      columns: this.columnDefs,
      data: [],
    }));

    // Method to handle click events on the Systems table
    $(document).ready(
      $('#timeTable').on('dbl-click-row.bs.table', function (e, row) {
        // Grab data for system by name
        this.apiService.getSystemByName(row['System Name']).subscribe((data: any[]) => {
          console.log("API data: ", data[0]);
          this.tableService.systemsTableClick(data[0]) });
      }.bind(this)
      ));

    // Visualization data
    this.apiService.getTIME().subscribe((data: any[]) => {
      var yearTimeCount = {};

      // Count number of each TIME value for each FY
      data.forEach(row => {
        let year = row['FY'];
        let timeVal = row['TIME Designation'];

        if (!(year in yearTimeCount)) yearTimeCount[year] = {};  // If year does not exist, add it
        if (!(timeVal in yearTimeCount[year])) yearTimeCount[year][timeVal] = 1;  // If time value for year does not exist, initialize to 1
        else yearTimeCount[year][timeVal]++;  // Else, increment time value for year by 1
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
        };
        this.vizData.push(dataPoint);
      }

      // For change detection to render chart after data has been processed
      this.vizData = [...this.vizData];

      // Set color scheme for chart
      this.colorScheme = this.colorSets.find(s => s.name === 'vivid');

      // console.log(this.vizData);  // Debug
    });
    
  }

  onSelect(event) {
    console.log(event);
  }

}
