import { Component, OnInit, ViewChild } from '@angular/core';
import { DataDictionary } from '@api/models/data-dictionary.model';
import { ApiService } from '@services/apis/api.service';

import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'data-dictionary-primeng',
  templateUrl: './data-dictionary-primeng.component.html',
  styleUrls: ['./data-dictionary-primeng.component.css']
})
export class DataDictionaryPrimeNGComponent implements OnInit {

  testData: DataDictionary[] = [];

  testFilterFields: any[] = ['Term', 'TermDefinition', 'DefinitionSource'];

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
      showColumn: false,
      isLink: true
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

  ngOnInit(): void {
    this.apiService.getEntireDataDictionary().subscribe(defs => {
      this.testData = defs;
    });

    // Enable popovers
    $(function () {
      $('[data-toggle="popover"]').popover()
    })

  }
}
