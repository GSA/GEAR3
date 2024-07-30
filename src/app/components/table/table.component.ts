import { Component, Input, OnInit } from '@angular/core';

interface ExportColumn {
  title: string;
  dataKey: string;
}

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css']
})

export class TableComponent implements OnInit {

  @Input() tableCols: any[] = [];
  @Input() tableData: any[] = [];
  @Input() filterFields: any[] = [];

  visibleColumns: any[] = [];
  isPaginated: boolean = true;
  exportColumns!: ExportColumn[];

  constructor() { }

  ngOnInit(): void {
    this.exportColumns = this.tableCols.map((col) => ({ title: col.header, dataKey: col.field }));

    this.tableCols.map(c => {
      if(c.showColumn) {
        this.visibleColumns.push(c);
      }
    })
  }

  toggleVisible(e: any) {
    this.tableCols.map(c => {
      if(c.field === e.originalEvent.option.field) {
        c.showColumn = e.originalEvent.selected;
      }
    });
  }

  togglePagination() {
    this.isPaginated = !this.isPaginated;
  }

  getExportFilename(reportName: string) {
    let today = new Date();
    let year = today.getFullYear();
    let month = today.toLocaleString('default', { month: 'long' });
    let day = today.getDate();
    let hour = today.getHours();
    let mins = today.getMinutes();

    let formattedDate = `${month}_${day}_${year}-${hour}_${mins}`;

    return `GEAR_${reportName}-${formattedDate}`;
  }

}
