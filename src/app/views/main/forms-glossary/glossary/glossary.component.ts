import { Component, OnInit } from '@angular/core';
import { Column } from '@common/table-classes';

import * as glossaryData from '../../../../../assets/statics/glossary.json';
import { TableService } from '@services/tables/table.service';

@Component({
    selector: 'glossary',
    templateUrl: './glossary.component.html',
    styleUrls: ['./glossary.component.scss'],
    standalone: false
})
export class GlossaryComponent implements OnInit {

  row: Object = <any>{};

  constructor(private tableService: TableService) { }

  tableData: any[] = [];
  tableDataOriginal: any[] = [];

  // Glossary Table Columns
  tableCols: Column[] = [{
    field: 'Term',
    header: 'Term',
    isSortable: true
  },
  {
    field: 'Definition',
    header: 'Definition'
  },
  {
    field: 'Reference',
    header: 'Reference'
  }]

  ngOnInit(): void {
    let rawData = JSON.stringify(glossaryData);
    this.tableDataOriginal = JSON.parse(rawData).default;
    this.tableData = JSON.parse(rawData).default;
    this.tableService.updateReportTableData(JSON.parse(rawData).default);
    this.tableService.updateReportTableDataReadyStatus(true);
  }
}
