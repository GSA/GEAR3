import { Component, OnInit } from '@angular/core';

import { TableService } from '@services/tables/table.service';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'artifacts',
  templateUrl: './artifacts.component.html',
  styleUrls: ['./artifacts.component.css']
})
export class ArtifactsComponent implements OnInit {

  constructor(
    private tableService: TableService) { }

  // Artifacts Table Options
  tableOptions: {} = this.tableService.createTableOptions({
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
    url: '/assets/statics/EAartifacts.json'
  });

  // Artifact Table Columns
  columnDefs: any[] = [{
    field: 'Title',
    title: 'Title',
    sortable: true
  },
  {
    field: 'Description',
    title: 'Description'
  }];

  ngOnInit(): void {
    $('#artifactsTable').bootstrapTable($.extend(this.tableOptions, {
      columns: this.columnDefs,
      data: [],
    }));

    // Method to handle click events on the Artifacts table
    $(document).ready(
      $('#artifactsTable').on('click-row.bs.table', function (e, row) {
        // console.log("Artifacts Table Clicked Row: ", row);  // Debug

        // Open new tab with link of row
        window.open(row.Link);

      }.bind(this)
      ));
  }

}
