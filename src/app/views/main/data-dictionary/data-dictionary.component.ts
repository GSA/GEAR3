import { Component, OnInit } from '@angular/core';
import { ApiService } from '@services/apis/api.service';

import { SharedService } from '@services/shared/shared.service';

import { Column } from '../../../common/table-classes';
import { DataDictionary } from '@api/models/data-dictionary.model';
import { TableService } from '@services/tables/table.service';

@Component({
    selector: 'data-dictionary',
    templateUrl: './data-dictionary.component.html',
    styleUrls: ['./data-dictionary.component.scss'],
    standalone: false
})
export class DataDictionaryComponent implements OnInit {

  row: Object = <any>{};

  constructor(
    private sharedService: SharedService,
    private apiService: ApiService,
    private tableService: TableService) {}

  tableData: DataDictionary[] = [];
  tableDataOriginal: DataDictionary[] = [];

  tableCols: Column[] = [
  {
    field: 'ReportName',
    header: 'Report Name',
    isSortable: true
  },
  {
    field: 'Term',
    header: 'Term',
    isSortable: true
  },
  {
    field: 'TermDefinition',
    header: 'Definition'
  },
  {
    field: 'DefinitionSource',
    header: 'Definition Source',
    isSortable: true,
    class: 'table-column-break-word'
  },
  {
    field: 'DefinitionSourceLink',
    header: 'Definition Source Link',
    formatter: this.sharedService.linksFormatter,
    showColumn: false
  },
  {
    field: 'DataSource',
    header: 'Data Source',
    isSortable: true
  },
  {
    field: 'DataSourceLink',
    header: 'Data Source Link',
    formatter: this.sharedService.linksFormatter,
    isSortable: false
  }
];

  ngOnInit(): void {
    this.apiService.getEntireDataDictionary().subscribe(defs => {
      this.tableDataOriginal = defs;
      this.tableData = defs;
      this.tableService.updateReportTableData(defs);
    });
  }
}
