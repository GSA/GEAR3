import { Component, OnInit, ViewChild } from '@angular/core';
import { DataDictionary } from '@api/models/data-dictionary.model';
import { ApiService } from '@services/apis/api.service';

import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';
import { MultiSelect, MultiSelectChangeEvent } from 'primeng/multiselect';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'data-dictionary-primeng',
  templateUrl: './data-dictionary-primeng.component.html',
  styleUrls: ['./data-dictionary-primeng.component.css']
})
export class DataDictionaryPrimeNGComponent implements OnInit {

  visibleColumns: any[] = [];
  isPaginated: boolean = true;

  testData: DataDictionary[] = [];

  testCols = [
    { 
      field: 'Term',
      header: 'Term',
      isSortable: true,
      showColumn: true
    },
    { 
      field: 'TermDefinition',
      header: 'Definition',
      isSortable: false,
      showColumn: true
    },
    { 
      field: 'DefinitionSource',
      header: 'Definition Source',
      isSortable: true,
      showColumn: true
    },
    { 
      field: 'DefinitionSourceLink',
      header: 'Definition Source Link',
      isSortable: false,
      showColumn: false
    },
    { 
      field: 'DataSource',
      header: 'Data Source',
      isSortable: true,
      showColumn: true
    },
    { 
      field: 'DataSourceLink',
      header: 'Data Source Link',
      isSortable: false,
      showColumn: false
    }
];

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
    showColumns: false,
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
    sortable: true,
    visible: false
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
    formatter: this.sharedService.linksFormatter
  },
  {
    field: 'DataSource',
    title: 'Data Source',
    sortable: true
  },
  {
    field: 'DataSourceLink',
    title: 'Data Source Link',
    formatter: this.sharedService.linksFormatter
  }
];

  ngOnInit(): void {
    this.apiService.getEntireDataDictionary().subscribe(defs => {
      this.testData = defs;
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

    this.testCols.map(c => {
      if(c.showColumn) {
        this.visibleColumns.push(c);
      }
    })
  }

  toggleVisible(e: any) {
    console.log(e);
    console.log(this.visibleColumns);
    this.testCols.map(c => {
      if(c.field === e.originalEvent.option.field) {
        c.showColumn = e.originalEvent.selected;
      }
    });
  }

  togglePagination() {
    this.isPaginated = !this.isPaginated;
  }
}
