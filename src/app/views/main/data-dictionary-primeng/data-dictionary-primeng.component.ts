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

  testFilterFields: any[] = ['ReportName', 'Term', 'TermDefinition', 'DefinitionSource'];

  buttonFilters: any[] = [];

  testCols = [
    {
      field: 'ReportName',
      header: 'Report Name',
      isSortable: true,
      showColumn: true
    },
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

      const testEntry: DataDictionary = {
        ReportName: 'IT Investments',
        Term: 'Investment UII',
        TermDefinition: 'A unique investment identifier',
        DefinitionSource: '',
        DefinitionSourceLink: '',
        DataSource: 'Folio',
        DataSourceLink: ''
      }

      this.testData.push(testEntry);

      this.createButtonFilters(this.testData, 'ReportName');
    });

    // Enable popovers
    $(function () {
      $('[data-toggle="popover"]').popover()
    })
  }

  // TODO: Make this more generic and move it into a service
  // TODO: Create arrays based on passed in property names
  /*
  * General Idea: the user passes in what property names they want to make filters of
  * then we use those here to create seperate arrays of all unique values
  * pass those arrays through a filter to remove any empty strings
  * then push them all into a parent array that gets sent into the table component
  * this lets us do groupings without having to pass in a bunch of "loose" data
  * */
  createButtonFilters(data: any, propName: string) {
    const uniqueReportNames = [...new Set(data.map(item => item.ReportName))];
    let uniqueDefinitionSource = [...new Set(data.map(item => item.DefinitionSource))] as DataDictionary[];
    uniqueDefinitionSource = uniqueDefinitionSource.filter(u => u);

    this.buttonFilters.push(uniqueReportNames);
    this.buttonFilters.push(uniqueDefinitionSource);
    console.log(this.buttonFilters)
  }
}
