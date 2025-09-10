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
    styleUrls: ['./table.component.scss'],
    standalone: false
})

export class TableComponent implements OnInit, OnChanges {

  @Input() tableCols: Column[] = [];

  @Input() localTableData: any[] = [];
  @Input() isLocal: boolean = false;

  @Input() filterButtons: TwoDimArray<FilterButton> = [];


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
  originalTableData: any[] = [];

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
    
    if (this.isLocal) {
      this.tableData = this.localTableData;
      this.originalTableData = [...this.localTableData];
    } else {
      this.tableService.reportTableData$.subscribe(d => {
        this.tableData = d;
        this.originalTableData = [...d];
      });
    }
    
    this.initializeColumnVisibility();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.localTableData && this.isLocal) {
      this.originalTableData = [...this.localTableData];
    }
    
    // Handle tableCols changes (e.g., when switching tabs)
    if (changes.tableCols && !changes.tableCols.firstChange) {
      this.initializeColumnVisibility();
    }
  }

  private initializeColumnVisibility() {
    // Simply set visibleColumns to all columns that should be visible
    this.visibleColumns = this.tableCols.filter(col => col.showColumn !== false);
  }


  // getTableData() {
  //   if(this.preFilteredTableData && this.preFilteredTableData.length > 0) {
  //     return this.preFilteredTableData;
  //   }
  //   return this.tableData;
  // }


  toggleVisible(e: any) {
    // Update showColumn property for each column based on multiSelect selection
    this.tableCols.forEach(col => {
      col.showColumn = this.visibleColumns.some(visibleCol => visibleCol.field === col.field);
    });
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
      this.filterEvent.emit('');
      this.generateColumns();
      this.updateOriginalData();
      return;
    }

    if (button && (button.filters && button.filters.length > 0)) {
      button.filters.forEach(f => {
        this.dt.filters[f.field] = [{ value: f.value, matchMode: f.matchMode ? f.matchMode : FilterMatchMode.EQUALS, operator: 'and' }];
      });
    }

    this.filterEvent.emit(button.buttonText);

    this.currentFilterButtons.push(button.buttonText);

    this.generateColumns();
    this.updateOriginalData();
  }

  onFilterButtonClear() {
    this.dt.reset();
    this.currentFilterButton = '';

    this.dt.sortField = this.defaultSortField;
    this.dt.sortOrder = this.defaultSortOrder;

    this.filterEvent.emit('');
    this.generateColumns();
    this.updateOriginalData();
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
    // Clear existing visible columns to avoid duplicates
    this.visibleColumns = [];
    
    // Add columns that should be visible
    this.tableCols.forEach(c => {
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
    if (!keyword || keyword.trim() === '') {
      this.tableData = [...this.originalTableData];
      return;
    }

    const searchTerm = keyword.toLowerCase().trim();
    const searchableColumns = this.tableCols.filter(col => col.field && col.showColumn !== false);
    
    const rankedData = this.originalTableData.map(item => {
      let maxScore = 0;
      
      searchableColumns.forEach(col => {
        const value = item[col.field];
        if (!value) return;
        
        const stringValue = String(value).toLowerCase();
        
        if (stringValue === searchTerm) {
          maxScore = Math.max(maxScore, this.originalTableData.length + 1);
        } else {
          const index = stringValue.indexOf(searchTerm);
          if (index !== -1) {
            maxScore = Math.max(maxScore, 1 / (index + 1));
          }
        }
      });
      
      return { item, score: maxScore };
    }).filter(ranked => ranked.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(ranked => ranked.item);
    
    this.tableData = rankedData;
  }

  private updateOriginalData() {
    if (this.isLocal) {
      this.originalTableData = [...this.localTableData];
    } else {
      this.originalTableData = [...this.tableData];
    }
  }
}