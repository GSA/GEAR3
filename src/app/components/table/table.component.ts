import { AfterViewInit, Component, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Table, TableRowSelectEvent } from 'primeng/table';
import { Column, ExportColumn, TwoDimArray, FilterButton } from '../../common/table-classes';
import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';
import { ApiService } from '@services/apis/api.service';
import { FilterMatchMode } from 'primeng/api';


@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss']
})

export class TableComponent implements OnInit, OnChanges {

  // Table columns and their options
  @Input() tableCols: Column[] = [];

  // The table data
  @Input() tableData: any[] = [];

  // Two dimenstional array of button filters
  // Each array of strings is a grouping of buttons
  @Input() filterButtons: TwoDimArray<FilterButton> = [];

  // Report style that drives the overall color of the table
  @Input() reportStyle: string = 'default';

  // Website type for modal click fn
  @Input() tableType: string = '';

  // The name of report for the export csv
  @Input() exportName: string = '';

  // An optional function to use for exporting the data
  // instead of the built in export function
  @Input() exportFunction: Function = null;

  // Inputs for showing/hiding specific toolbar items
  // as well as the entire toolbar itself
  @Input() showToolbar: boolean = true;
  @Input() showSearchbar: boolean = true;
  @Input() showShowHideColumnButton: boolean = true;
  @Input() showPaginationToggleButton: boolean = true;
  @Input() showExportButton: boolean = true;
  @Input() showFilterButton: boolean = true;

  // Default sort inputs order is either 1 or -1
  // for ascending and descending respectively
  @Input() defaultSortField: string = '';
  @Input() defaultSortOrder: number = 1;

  @Input() preFilteredTableData: any[] = [];

  // Filter event (some reports change available columns when filtered)
  @Output() filterEvent = new EventEmitter<string>();

  @ViewChild(Table) private dt: Table;

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.setScreenHeight();
  }

  visibleColumns: Column[] = [];
  isPaginated: boolean = true;
  exportColumns!: ExportColumn[];
  currentFilterButton: string = '';
  screenHeight: string = '';
  showFilters: boolean = false;
  first: number = 0;
  rows: number = 10;

  activeTableData: any[] = [];

  constructor(public sharedService: SharedService, public tableService: TableService, public apiService: ApiService) {
    this.setScreenHeight();
   }

  ngOnInit(): void {
    this.exportColumns = this.tableCols.map((col) => ({ title: col.header, dataKey: col.field }));
    this.activeTableData = this.getTableData();
    this.generateColumns();
  }

  ngOnChanges(changes: SimpleChanges) {
    if(changes.tableData && (changes.tableData.previousValue && changes.tableData.previousValue.length === 0)
      || changes.preFilteredTableData && (changes.preFilteredTableData.previousValue && changes.preFilteredTableData.previousValue.length === 0)) {
      this.activeTableData = this.getTableData();
    }
  }

  getTableData() {
    if(this.preFilteredTableData && this.preFilteredTableData.length > 0) {
      return this.preFilteredTableData;
    }
    return this.tableData;
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

  toggleFilter() {
    this.showFilters = !this.showFilters;
  }

  getExportFilename() {
    let today = new Date();
    let year = today.getFullYear();
    let month = today.toLocaleString('default', { month: 'long' });
    let day = today.getDate();
    let hour = today.getHours();
    let mins = today.getMinutes();

    let formattedDate = `${month}_${day}_${year}-${hour}_${mins}`;

    return `GEAR_${this.exportName}-${formattedDate}`;
  }

  onFilterButtonClick(button: FilterButton) {
    this.dt.filter('', '', '');
    this.dt.reset();
    this.activeTableData = this.tableData;

    if(button && (button.filters && button.filters.length > 0)) {
      button.filters.forEach(f => {
        this.dt.filters[f.field] = [{value: f.value, matchMode: f.matchMode ? f.matchMode : FilterMatchMode.EQUALS, operator: 'and'}];
      });
    }

    this.filterEvent.emit(button.buttonText);
  
    this.currentFilterButton = button.buttonText;

    this.generateColumns();
  }

  onFilterButtonClear() {
    this.dt.reset();
    this.currentFilterButton = '';

    if(this.hasPreFilteredTableData()) { 
      this.activeTableData = this.preFilteredTableData;
    } else {
      this.activeTableData = this.tableData;
    }

    this.dt.sortField = this.defaultSortField;
    this.dt.sortOrder = this.defaultSortOrder;

    this.filterEvent.emit('');
    this.generateColumns();
  }

  onExportData() {
    if(this.exportFunction) {
      this.dt.exportFunction();
    } else {
      this.dt.exportCSV();
    }
  }

  applyFilteredStyle(filter: string) {
    if(this.currentFilterButton === filter) {
      return 'filtered';
    }

    return '';
  }

  showColumn(c: Column) {
    return c.showColumn || !('showColumn' in c);
  }

  setScreenHeight() {
    const TABLE_HEIGHT_OFFSET: number = 315;
    if(window.innerHeight < 800) {
      this.screenHeight = `${window.innerHeight}px`;
    } else {
      this.screenHeight = `${(window.innerHeight - TABLE_HEIGHT_OFFSET)}px`;
    }
  }

  pageChange(event) {
    this.first = event.first;
    this.rows = event.rows;
  }

  hasPreFilteredTableData() {
    return this.preFilteredTableData && this.preFilteredTableData.length > 0;
  }

  generateColumns() {
    this.tableCols.map(c => {
      if(this.showColumn(c)) {
        this.visibleColumns.push(c);
      }
    });
  }

  onRowSelect(e: TableRowSelectEvent) {
    switch (this.tableType) {
      case 'investments':
        this.tableService.investTableClick(e.data);
        break;
      case 'capabilities':
        this.tableService.capsTableClick(e.data);
        break;
      case 'websiteServiceCategory':
        this.tableService.websiteServiceCategoryTableClick(e.data);
        break;
      case 'organizations':
        this.tableService.orgsTableClick(e.data);
        break;
      case 'website':
        this.tableService.websitesTableClick(e.data);
        break;
      case 'records':
        this.tableService.recordsTableClick(e.data);
        break;
      case 'time':
        this.apiService.getOneSys(e.data['System Id'])
          .subscribe((data: any[]) => {
              this.tableService.systemsTableClick(data[0]);
            });

          // Change URL to include ID
          this.sharedService.addIDtoURL(e.data, 'System Id');
      case 'systems':
        this.tableService.systemsTableClick(e.data);
        break;
      case 'fisma':
        this.tableService.fismaTableClick(e.data);
        break;
      case 'fismaPoc':
        this.tableService.fismaTableClick(e.data);
        break;
      case 'itStandards':
        this.tableService.itStandTableClick(e.data);
      default:
        console.log('no type');
        break;
    }
  }

}
