import { Component, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Table, TableRowSelectEvent } from 'primeng/table';
import { Column, ExportColumn, TwoDimArray, FilterButton } from '../../common/table-classes';
import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';
import { ApiService } from '@services/apis/api.service';
import { FilterMatchMode, SelectItem } from 'primeng/api';


@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss']
})

export class TableComponent implements OnInit, OnChanges {

  // Table columns and their options
  @Input() tableCols: Column[] = [];

  @Input() localTableData: any[] = [];
  @Input() isLocal: boolean = false;

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

  // Show/hide pagination
  @Input() showPagination: boolean = true;

  // Default sort inputs order is either 1 or -1
  // for ascending and descending respectively
  @Input() defaultSortField: string = '';
  @Input() defaultSortOrder: number = 1;

  @Input() preFilteredTableData: any[] = [];

  // Filter event (some reports change available columns when filtered)
  @Output() filterEvent = new EventEmitter<string>();

  // Row click event
  @Output() rowClickEvent = new EventEmitter<any>();

  @ViewChild(Table) private dt: Table;

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.setScreenHeight();
  }

  tableData: any[] = [];

  visibleColumns: Column[] = [];
  exportColumns!: ExportColumn[];
  currentFilterButton: string = '';
  currentFilterButtons: string[] = [];
  screenHeight: string = '';
  showFilters: boolean = false;
  first: number = 0;
  rows: number = 10;

  activeTableData: any[] = [];

  matchModeOptions: SelectItem[];

  constructor(public sharedService: SharedService, public tableService: TableService, public apiService: ApiService) {
    this.setScreenHeight();
  }

  ngOnInit(): void {
    this.matchModeOptions = [
      { label: 'Contains', value: FilterMatchMode.CONTAINS },
      { label: 'Not Contains', value: FilterMatchMode.NOT_CONTAINS },
      { label: 'Starts With', value: FilterMatchMode.STARTS_WITH },
      { label: 'Ends With', value: FilterMatchMode.ENDS_WITH }
    ];

    this.exportColumns = this.tableCols.map((col) => ({ title: col.header, dataKey: col.field }));
    // this.activeTableData = this.getTableData();
    if (this.isLocal) {
      this.tableData = this.localTableData;
    } else {
      this.tableService.reportTableData$.subscribe(d => {
        this.tableData = d;
      });
    }
    const stored = localStorage.getItem('visibleColumns');
    if (stored) {
      this.visibleColumns = JSON.parse(stored);
      // Sync showColumn state in tableCols
      this.tableCols.forEach(col => {
        col.showColumn = this.visibleColumns.some(v => v.field === col.field);
      });
    } else {
      // Default to all visible
      this.visibleColumns = this.tableCols.filter(col => col.showColumn !== false);
    } 

    this.generateColumns();
  }

  ngOnChanges(changes: SimpleChanges) {
    // if(changes.tableData && (changes.tableData.previousValue && changes.tableData.previousValue.length === 0)
    //   || changes.preFilteredTableData && (changes.preFilteredTableData.previousValue && changes.preFilteredTableData.previousValue.length === 0)) {
    //   this.activeTableData = this.getTableData();
    // }
  }

  // getTableData() {
  //   if(this.preFilteredTableData && this.preFilteredTableData.length > 0) {
  //     return this.preFilteredTableData;
  //   }
  //   return this.tableData;
  // }

  toggleVisible(e: any) {
    this.tableCols.map(c => {
      if (c.field === e.originalEvent.option.field) {
        c.showColumn = e.originalEvent.selected;
      }
    });

    this.visibleColumns = this.tableCols.filter(col => col.showColumn !== false);
    localStorage.setItem('visibleColumns', JSON.stringify(this.visibleColumns));
  }

  togglePagination() {
    this.showPagination = !this.showPagination;
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
    let currentFilterIndex = -1;
    currentFilterIndex = this.currentFilterButtons.findIndex(b => b === button.buttonText);

    if (currentFilterIndex >= 0) {
      this.currentFilterButtons.splice(currentFilterIndex, 1);
      if (button.filters && button.filters.length > 0) {
        button.filters.forEach(f => {
          delete this.dt.filters[f.field];
        });
      }
      // this.activeTableData = this.tableData;
      this.filterEvent.emit('');
      this.generateColumns();
      return;
    }

    //this.dt.filter('', '', '');
    //this.dt.reset();
    // this.activeTableData = this.tableData;

    if (button && (button.filters && button.filters.length > 0)) {
      button.filters.forEach(f => {
        this.dt.filters[f.field] = [{ value: f.value, matchMode: f.matchMode ? f.matchMode : FilterMatchMode.EQUALS, operator: 'and' }];
      });
    }

    this.filterEvent.emit(button.buttonText);

    this.currentFilterButtons.push(button.buttonText);

    this.generateColumns();
  }

  onFilterButtonClear() {
    this.dt.reset();
    this.currentFilterButton = '';

    // if(this.hasPreFilteredTableData()) { 
    //   this.activeTableData = this.preFilteredTableData;
    // } else {
    //   this.activeTableData = this.tableData;
    // }

    this.dt.sortField = this.defaultSortField;
    this.dt.sortOrder = this.defaultSortOrder;

    this.filterEvent.emit('');
    this.generateColumns();
  }

  onExportData() {
    if (this.exportFunction) {
      this.dt.exportFunction();
    } else {
      this.dt.exportCSV();
    }
  }

  applyFilteredStyle(filter: string) {
    if (this.currentFilterButton === filter) {
      return 'filtered';
    }

    return '';
  }

  showColumn(c: Column) {
    return c.showColumn || !('showColumn' in c);
  }

  setScreenHeight() {
    const TABLE_HEIGHT_OFFSET: number = 315;
    if (window.innerHeight < 800) {
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
      if (this.showColumn(c)) {
        this.visibleColumns.push(c);
      }
    });
  }

  public onRowSelect(e: TableRowSelectEvent) {
    this.rowClickEvent.emit(e.data);
  }

  // onRowSelect(e: TableRowSelectEvent) {
  //   if(this.tableType === 'globalSearch') {
  //     this.tableRowClickSelection(e.data.GEAR_Type, e.data);
  //     return;
  //   } else if(this.tableType === 'accessForms') {
  //     this.rowClickEvent.emit(e);
  //     return;
  //   } else {
  //     this.tableRowClickSelection(this.tableType, e.data);
  //     return;
  //   }
  // }

  private tableRowClickSelection(type: string, data: any) {
    switch (type) {
      case 'Investment':
        this.tableService.globalSearchTableClick(data);
        break;
      case 'investments':
        this.tableService.investTableClick(data);
        break;
      case 'Capability':
        this.tableService.globalSearchTableClick(data);
        break;
      case 'capabilities':
        this.tableService.capsTableClick(data);
        break;
      case 'websiteServiceCategory':
        this.tableService.websiteServiceCategoryTableClick(data);
        break;
      case 'Organization':
        this.tableService.globalSearchTableClick(data);
        break;
      case 'organizations':
        this.tableService.orgsTableClick(data);
        break;
      case 'Website':
        this.tableService.globalSearchTableClick(data);
        break;
      case 'website':
        this.tableService.websitesTableClick(data);
        break;
      case 'records':
        this.tableService.recordsTableClick(data);
        break;
      case 'time':
        this.apiService.getOneSys(data['System Id'])
          .subscribe((data: any) => {
            this.tableService.systemsTableClick(data[0]);
          });

        // Change URL to include ID
        this.sharedService.addIDtoURL(data, 'System Id');
      case 'System':
        this.tableService.globalSearchTableClick(data);
        break;
      case 'systems':
        this.tableService.systemsTableClick(data);
        break;
      case 'FISMA':
        this.tableService.globalSearchTableClick(data);
        break;
      case 'fisma':
        this.tableService.fismaTableClick(data);
        break;
      case 'fismaPoc':
        this.tableService.fismaTableClick(data);
        break;
      case 'Technology':
        this.tableService.globalSearchTableClick(data);
        break;
      case 'itStandards':
        this.tableService.itStandTableClick(data);
      default:
        console.log('no type');
        break;
    }
  }

  isFilterButtonActive(filterButton: string) {
    //if(this.currentFilterButtons && this.currentFilterButtons.length > 0) {
    return this.currentFilterButtons.forEach(c => {
      return c === filterButton;
    });
    //}
  }

  onTableSearch(keyword: string) {
    let isnum = /^\d+$/.test(keyword);
    if (isnum) {
      this.dt.filterGlobal(keyword, 'equals');
    } else {
      this.dt.filterGlobal(keyword, 'contains');
    }
  }
}
