import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { Table } from 'primeng/table';

interface ExportColumn {
  title: string;
  dataKey: string;
}

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss']
})

export class TableComponent implements OnInit {

  @Input() tableCols: any[] = [];
  @Input() tableData: any[] = [];
  @Input() filterFields: any[] = [];
  @Input() buttonFilters: any[] = [];

  @ViewChild(Table) private dt: Table;

  visibleColumns: any[] = [];
  isPaginated: boolean = true;
  exportColumns!: ExportColumn[];
  currentButtonFilter: string = '';
  screenHeight: string = '';

  constructor() {
    this.screenHeight = `${(window.screen.height - 700).toString()}px`;
   }

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

  onButtonFilter(value: string) {
    this.dt.filterGlobal(value, 'contains');
    this.currentButtonFilter = value;
  }

  onButtonFilterClear() {
    this.dt.reset();
    this.currentButtonFilter = '';
  }

  applyFilteredStyle(filter: string) {
    if(this.currentButtonFilter === filter) {
      return 'filtered';
    }

    return '';
  }

}
