import { ApiService } from '@services/apis/api.service';
import { PLATFORM_ID, Component, OnInit, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SharedService } from '@services/shared/shared.service';

import { Column } from '../../../common/table-classes';
import { DataDictionary } from '@api/models/data-dictionary.model';

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
    private apiService: ApiService, 
    @Inject(PLATFORM_ID) private platformId: Object) {}

  tableData: DataDictionary[] = [];

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
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.apiService.getEntireDataDictionary().subscribe(defs => {
      this.tableData = defs;
    });

    // Enable popovers
    $(function () {
      $('[data-toggle="popover"]').popover()
    })
  }
}
