import { PLATFORM_ID, Component, OnInit, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'glossary',
  templateUrl: './glossary.component.html',
  styleUrls: ['./glossary.component.css']
})
export class GlossaryComponent implements OnInit {

  row: Object = <any>{};

  constructor(
    private sharedService: SharedService,
    private tableService: TableService,
    @Inject(PLATFORM_ID) private platformId: Object) { }

  // Glossary Table Options
  glossTableOptions: {} = this.tableService.createTableOptions({
    advancedSearch: false,
    idTable: null,
    classes: "table-hover table-dark",
    showColumns: false,
    showExport: true,
    exportFileName: 'GEAR_Glossary',
    headerStyle: null,
    pagination: true,
    search: true,
    sortName: 'Term',
    sortOrder: 'asc',
    showToggle: true,
    url: '/assets/statics/glossary.json'
  });

  // Glossary Table Columns
  glossColumnDefs: any[] = [{
    field: 'Term',
    title: 'Term',
    sortable: true
  },
  {
    field: 'Definition',
    title: 'Definition'
  },
  {
    field: 'Reference',
    title: 'Reference'
  }]

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    // Enable popovers
    $(function () {
      $('[data-toggle="popover"]').popover()
    })

    $('#glossaryTable').bootstrapTable($.extend(this.glossTableOptions, {
      columns: this.glossColumnDefs,
      data: [],
    }));

    const self = this;
    $(document).ready(function() {
      //Enable table sticky header
      self.sharedService.enableStickyHeader("glossaryTable");
    });
  }
}
