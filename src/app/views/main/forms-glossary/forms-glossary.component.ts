import { Component, OnInit } from '@angular/core';

import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'forms-glossary',
  templateUrl: './forms-glossary.component.html',
  styleUrls: ['./forms-glossary.component.css']
})
export class FormsGlossaryComponent implements OnInit {

  row: Object = <any>{};

  constructor(
    private sharedService: SharedService,
    private tableService: TableService) { }

  // Forms Table Options
  formsTableOptions: {} = this.tableService.createTableOptions({
    advancedSearch: false,
    idTable: null,
    classes: "table-hover table-dark clickable-table",
    showColumns: false,
    showExport: false,
    exportFileName: null,
    headerStyle: null,
    pagination: false,
    search: false,
    sortName: 'Title',
    sortOrder: 'asc',
    showToggle: false,
    url: '/assets/statics/accessforms.json'
  });

  // Forms Table Columns
  formsColumnDefs: any[] = [{
    field: 'Title',
    title: 'Title',
    sortable: true
  },
  {
    field: 'Description',
    title: 'Description'
  },
  {
    field: 'POC',
    title: 'POC'
  }];

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
    // Enable popovers
    $(function () {
      $('[data-toggle="popover"]').popover()
    })

    $('#formsTable').bootstrapTable($.extend(this.formsTableOptions, {
      columns: this.formsColumnDefs,
      data: [],
    }));

    $('#glossaryTable').bootstrapTable($.extend(this.glossTableOptions, {
      columns: this.glossColumnDefs,
      data: [],
    }));

    // Method to handle click events on the Investments table
    $(document).ready(
      $('#formsTable').on('click-cell.bs.table', function (e, field, value, row) {
        // console.log("Forms Table Clicked Element: ", e);  // Debug
        // console.log("Forms Table Clicked Field: ", field);  // Debug
        // console.log("Forms Table Clicked Cell Value: ", value);  // Debug
        // console.log("Forms Table Clicked Row: ", row);  // Debug

        if (field === 'Description') {
          // Open new tab with link of row
          window.open(row.Link);
        } else if (field === 'POC') {
          // Open new tab to compose email
          window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${row.POC_email}`);
        }

      }.bind(this)
      ));
  }

}
