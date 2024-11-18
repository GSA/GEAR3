import { Component, OnInit } from '@angular/core';
import { Column } from '@common/table-classes';

import * as glossaryData from '../../../../../assets/statics/glossary.json';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'glossary',
  templateUrl: './glossary.component.html',
  styleUrls: ['./glossary.component.css']
})
export class GlossaryComponent implements OnInit {

  row: Object = <any>{};

  constructor() { }

  tableData: any[] = [];

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
    // Enable popovers
    $(function () {
      $('[data-toggle="popover"]').popover()
    })

    let rawData = JSON.stringify(glossaryData);
    this.tableData = JSON.parse(rawData).default;
  }
}
