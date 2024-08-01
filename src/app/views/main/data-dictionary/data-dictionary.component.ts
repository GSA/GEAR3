import { Component, OnInit } from '@angular/core';
import { ApiService } from '@services/apis/api.service';

import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'data-dictionary',
  templateUrl: './data-dictionary.component.html',
  styleUrls: ['./data-dictionary.component.css']
})
export class DataDictionaryComponent implements OnInit {

  row: Object = <any>{};

  constructor(
    private sharedService: SharedService,
    private tableService: TableService,
    private apiService: ApiService) {}

  // Data Dictionary Table Options
  ddTableOptions: {} = this.tableService.createTableOptions({
    advancedSearch: false,
    idTable: null,
    classes: "table-hover table-dark",
    showColumns: true,
    showExport: true,
    exportFileName: 'GEAR_Data_Dictionary',
    headerStyle: null,
    pagination: true,
    search: true,
    sortName: 'Term',
    sortOrder: 'asc',
    showToggle: true
  });

  // Data Dictionary Table Columns
  ddColumnDefs: any[] = [{
    field: 'ReportName',
    title: 'ReportName',
    sortable: true
  },
  {
    field: 'Term',
    title: 'Term',
    sortable: true
  },
  {
    field: 'TermDefinition',
    title: 'Definition'
  },
  {
    field: 'DefinitionSource',
    title: 'Definition Source',
    sortable: true
  },
  {
    field: 'DefinitionSourceLink',
    title: 'Definition Source Link',
    formatter: this.sharedService.linksFormatter,
    visible: false
  },
  {
    field: 'DataSource',
    title: 'Data Source',
    sortable: true
  },
  {
    field: 'DataSourceLink',
    title: 'Data Source Link',
    formatter: this.sharedService.linksFormatter,
    visible: false
  }
];

  ngOnInit(): void {
    this.apiService.getEntireDataDictionary().subscribe(defs => {
      $('#dataDictionaryTable').bootstrapTable($.extend(this.ddTableOptions, {
        columns: this.ddColumnDefs,
        data: defs,
      }));
    });

    // Enable popovers
    $(function () {
      $('[data-toggle="popover"]').popover()
    })

    const self = this;
    $(document).ready(function() {
      //Enable table sticky header
      self.sharedService.enableStickyHeader("dataDictionaryTable");
    });
  }
}
