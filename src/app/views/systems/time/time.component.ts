import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { colorSets } from '@swimlane/ngx-charts';

import { ApiService } from '@services/apis/api.service';
import { ModalsService } from '@services/modals/modals.service';
import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';
import { Title } from '@angular/platform-browser';

import { Column } from '../../../common/table-classes';
import { TIME } from '@api/models/systime.model';

@Component({
  selector: 'time',
  templateUrl: './time.component.html',
  styleUrls: ['./time.component.scss'],
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

  tableData: TIME[] = [];
  tableDataOriginal: TIME[] = [];

  tableCols: Column[] = [
    {
      field: 'System Name',
      header: 'System Name',
      isSortable: true,
    },
    {
      field: 'FY',
      header: 'FY',
      isSortable: true,
    },
    {
      field: 'TIME Designation',
      header: 'TIME Designation',
      isSortable: true,
    },
    {
      field: 'Business Score',
      header: 'Business Score',
      showColumn: false,
      isSortable: true,
    },
    {
      field: 'Technical Score',
      header: 'Technical Score',
      showColumn: false,
      isSortable: true,
    },
    {
      field: 'O&M Cost',
      header: 'O&M Cost',
      showColumn: false,
      isSortable: true,
    },
    {
      field: 'DM&E Cost',
      header: 'DM&E Cost',
      showColumn: false,
      isSortable: true,
    },
    {
      field: 'Software/Hardware License Costs',
      header: 'License Costs',
      showColumn: false,
      isSortable: true,
    },
    {
      field: 'Questionnaire Last Updated',
      header: 'Questionnaire Last Updated',
      isSortable: true,
      showColumn: false,
      formatter: this.sharedService.dateFormatter,
    },
    {
      field: 'POC Last Updated',
      header: 'POC of Last Updated',
      isSortable: true,
      showColumn: false,
      formatter: this.sharedService.emailFormatter,
    },
    {
      field: 'File Link',
      header: 'File Link',
      isSortable: true,
      showColumn: false,
      formatter: this.sharedService.linksFormatter,
    },
  ];

  ngOnInit(): void {
    this.apiService.getTIME().subscribe(t => {
      this.tableService.updateReportTableData(t);
      this.tableData = t;
      this.tableDataOriginal = t;
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
        this.apiService.getOneSys(detailSysID).subscribe((data: any) => {
          this.tableService.systemsTableClick(data[0]);
          // this.getInterfaceData(row.ID);
        });
      }
    });
  }

  onSelect(event) {
    // console.log(event);
  }

  public onDefinitionsClick(): void {
    this.router.navigate(['/about', 'sysRat']);
  }

  public onQuestionaireClick(): void {
    window.open('https://docs.google.com/spreadsheets/d/1cx-gi-jjHSvAD57Z0T812a0o7eJ-IWIAqlhE0ZTTMTI/edit#gid=362432297', '_blank');
  }
}