import { Component, OnInit } from '@angular/core';

import { Column } from '@common/table-classes';
import { TableService } from '@services/tables/table.service';

import * as accessFormsData from '../../../../../assets/statics/accessforms.json';

@Component({
  selector: 'forms',
  templateUrl: './forms.component.html',
  styleUrls: ['./forms.component.scss']
})
export class FormsComponent implements OnInit {

  tableData: any[] = [];
  tableDataOriginal: any[] = [];

  constructor(private tableService: TableService) { }

  // Forms Table Columns
  tableCols: Column[] = [{
    field: 'Title',
    header: 'Title',
    isSortable: true
  },
  {
    field: 'Description',
    header: 'Description'
  },
  {
    field: 'POC',
    header: 'POC'
  }];

  ngOnInit(): void {
    let rawData = JSON.stringify(accessFormsData);
    this.tableDataOriginal = JSON.parse(rawData).default;
    this.tableData = JSON.parse(rawData).default;
    this.tableService.updateReportTableData(JSON.parse(rawData).default);
  }

  onRowClick(e: any) {
    if(e.originalEvent.srcElement.childNodes[0].data === e.data.POC) {
      window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${e.data.POC_email}`);
    } else {
      window.open(e.data.Link);
    }

  }
}
