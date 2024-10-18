import { PLATFORM_ID, Component, OnInit, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'forms',
  templateUrl: './forms.component.html',
  styleUrls: ['./forms.component.css']
})
export class FormsComponent implements OnInit {

  row: Object = <any>{};

  constructor(
    private sharedService: SharedService,
    private tableService: TableService,
    @Inject(PLATFORM_ID) private platformId: Object) { }

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

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    // Enable popovers
    $(function () {
      $('[data-toggle="popover"]').popover()
    })

    $('#formsTable').bootstrapTable($.extend(this.formsTableOptions, {
      columns: this.formsColumnDefs,
      data: [],
    }));

    const self = this;
    $(document).ready(function() {
      // Method to handle click events on the Investments table
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
      }.bind(this));

      //Enable table sticky header
      self.sharedService.enableStickyHeader("formsTable");
    });
  }
}
