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
  yAxisLabel: string = '# of Applications';
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
    exportFileName: 'Business_Apps_TIME_Report',
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
    field: 'DisplayName',
    title: 'Display Name',
    sortable: true,
    visible: false
  }, {
    field: 'Name',
    title: 'Application Name',
    sortable: true
  }, {
    field: 'SSO',
    title: 'SSO',
    visible: false,
    sortable: true
  }, {
    field: 'OwnerShort',
    title: 'Owning Org (Short)',
    sortable: true,
  }, {
    field: 'Owner',
    title: 'Owning Org (Long)',
    visible: false,
    sortable: true
  }, {
    field: 'SupportShort',
    title: 'Supporting Org (Short)',
    sortable: true
  }, {
    field: 'Support',
    title: 'Supporting Org (Long)',
    sortable: true,
    visible: false
  }, {
    field: 'ParentSystem',
    title: 'Parent System',
    sortable: true,
    visible: false,
    formatter: this.sharedService.systemFormatter
  }, {
    field: 'CUI',
    title: 'CUI',
    sortable: true,
    visible: false
  }, {
    field: 'Status',
    title: 'Status',
    sortable: true
  }, {
    field: 'ProdYear',
    title: 'Production Year',
    sortable: true,
    visible: false
  }, {
    field: 'FY14',
    title: 'FY14',
    visible: false,
    formatter: this.sharedService.FYFormatter
  }, {
    field: 'FY15',
    title: 'FY15',
    visible: false,
    formatter: this.sharedService.FYFormatter
  }, {
    field: 'FY16',
    title: 'FY16',
    visible: false,
    formatter: this.sharedService.FYFormatter
  }, {
    field: 'FY17',
    title: 'FY17',
    visible: false,
    formatter: this.sharedService.FYFormatter
  }, {
    field: 'FY18',
    title: 'FY18',
    visible: false,
    formatter: this.sharedService.FYFormatter
  }, {
    field: 'FY19',
    title: 'FY19',
    visible: false,
    formatter: this.sharedService.FYFormatter
  }, {
    field: 'FY20',
    title: 'FY20',
    formatter: this.sharedService.FYFormatter
  }, {
    field: 'FY21',
    title: 'FY21',
    formatter: this.sharedService.FYFormatter
  }, {
    field: 'FY22',
    title: 'FY22',
    visible: false,
    formatter: this.sharedService.FYFormatter
  }, {
    field: 'FY23',
    title: 'FY23',
    formatter: this.sharedService.FYFormatter
  }, {
    field: 'FY24',
    title: 'FY24',
    formatter: this.sharedService.FYFormatter
  }, {
    field: 'Notes',
    title: 'Notes',
    visible: false,
    sortable: true
  }, {
    field: 'BusPOC',
    title: 'Business POC',
    visible: false,
    sortable: true
  }, {
    field: 'TechPOC',
    title: 'Technical POC',
    visible: false,
    sortable: true
  }, {
    field: 'OMBUID',
    title: 'Application ID',
    sortable: true,
    visible: false
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
      $('#timeTable').on('click-row.bs.table', function (e, row) {
        this.tableService.appsTableClick(row);
      }.bind(this)
      ));

    // Filter by only non-retired
    $(document).ready(
      $('#timeTable').bootstrapTable('filterBy', {
        Status: ['Candidate', 'Pre-Production', 'Production']
      })
    );

    // Visualization data
    this.apiService.getApplications().subscribe((data: any[]) => {
      data = data.map(row => row.AppTime);
      var yearTimeCount = {};

      data.forEach(timeStr => {
        if (timeStr != '') {  // Skip if empty string
          let FYs = timeStr.split('; ');

          FYs.forEach(fy => {
            let str = fy.split(', ');
            let year = str[0];  // Fiscal Year for app
            let value = str[1];  // Time value for corresponding fiscal year

            if (value === 'N/A' || !(['FY19', 'FY20', 'FY21', 'FY22', 'FY23'].includes(year))) return  // Do not count N/As or anything before FY19
            if (!(year in yearTimeCount)) yearTimeCount[year] = {};  // If year does not exist, add it
            if (!(value in yearTimeCount[year])) yearTimeCount[year][value] = 1;  // If time value for year does not exist, initialize to 1
            else yearTimeCount[year][value]++;  // Else, increment time value for year by 1
          });
        };
      });
      
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
