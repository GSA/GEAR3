import { Component, ContentChild, EventEmitter, HostListener, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, TemplateRef, ViewChild } from '@angular/core';
import { Table, TablePageEvent, TableLazyLoadEvent, TableRowSelectEvent } from 'primeng/table';
import { Column, ExportColumn, TwoDimArray, FilterButton, ColumnFilter } from '../../common/table-classes';
import { SharedService } from '@services/shared/shared.service';
import { CookieService } from '@services/shared/cookie.service';
import { TableService } from '@services/tables/table.service';
import { ApiService } from '@services/apis/api.service';
import { FilterMatchMode, SelectItem } from 'primeng/api';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Location } from '@angular/common';
import { DataDictionary } from '@api/models/data-dictionary.model';


@Component({
    selector: 'app-table',
    templateUrl: './table.component.html',
    styleUrls: ['./table.component.scss'],
    standalone: false
})

export class TableComponent implements OnInit, OnChanges, OnDestroy {

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
  @Input() exportFunction: Function | null = null;

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

  // Disable the sticky (pinned) table header. When false, the table renders
  // in a non-scrollable, fully-expanded layout and the header flows with the
  // page instead of pinning (and scrolling content behind it).
  @Input() stickyHeader: boolean = true;

  // Default sort inputs order is either 1 or -1
  // for ascending and descending respectively
  @Input() defaultSortField: string = '';
  @Input() defaultSortOrder: number = 1;

  @Input() preFilteredTableData: any[] = [];
  @Input() contextSystemName: string = '';

  @Input() defaultPaginationNumber: number = 50;

  @Input() visibleColumnStorageKey: string = '';

  @Input() attrDefs: DataDictionary[] = [];

  // Server-side (lazy) pagination
  @Input() serverSidePagination: boolean = false;
  @Input() serverSideTotalRecords: number = 0;

  // Emits {page, pageSize, sortField, sortOrder, search} for server-side pagination
  @Output() lazyLoadEvent = new EventEmitter<{ page: number; pageSize: number; sortField: string; sortOrder: number; search: string }>();

  // Row expansion support
  @Input() showExpandColumn: boolean = false;
  @Input() expandDataKey: string = 'id';
  @Input() expandableRowField: string = '';
  // When true, clicking an expandable row toggles its expansion instead of emitting rowClickEvent
  @Input() expandOnRowClick: boolean = false;

  @ContentChild('expansionRows', { read: TemplateRef }) expansionRowsTemplate: TemplateRef<any>;

  expandedRows: { [key: string]: boolean } = {};

  // Filter event (some reports change available columns when filtered)
  @Output() filterEvent = new EventEmitter<string>();

  // Row click event
  @Output() rowClickEvent = new EventEmitter<any>();

  @ViewChild(Table) private dt!: Table;

  @HostListener('window:resize', ['$event'])
  onResize(event: UIEvent) {
    this.setScreenHeight();
    this.adjustTableHeight();
  }

  @HostListener('window:orientationchange', ['$event'])
  onOrientationChange(event: Event) {
    setTimeout(() => {
      this.setScreenHeight();
      this.adjustTableHeight();
    }, 300);
  }

  private adjustTableHeight() {
    //setTimeout(() => {
      if (this.dt) {
        this.dt.resetScrollTop();
      }
    //}, 100);
  }

  tableData: any[] = [];
  originalTableData: any[] = [];

  visibleColumns: Column[] = [];
  pickableColumns: Column[] = [];
  exportColumns!: ExportColumn[];
  currentFilterButton: string = '';
  currentFilterButtons: string[] = [];
  screenHeight: string = '';
  showFilters: boolean = false;
  showColumnFilterModal: boolean = false;
  first: number = 0;
  rows: number = 10;

  activeTableData: any[] = [];

  matchModeOptions: SelectItem[] = [];

  isDataReady: boolean = false;

  tableSearchControl = new FormControl('');
  private tableSearchSubscription?: Subscription;

  private tabelSearchString: string = '';
  private urlSearchTerm: string = '';
  private isHandlingDataUpdate: boolean = false;
  private defaultColumnVisibility: Map<string, boolean> = new Map();
  private tableDataSubscription?: Subscription;
  private tableReadySubscription?: Subscription;
  private queryParamsSubscription?: Subscription;

  constructor(
    private sharedService: SharedService,
    private cookieService: CookieService,
    private tableService: TableService,
    private apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute,
    private location: Location
  ) {
    this.setScreenHeight();
  }

  ngOnInit(): void {
    // Search is now triggered by Enter key, not by value changes
    // But we still need to handle when search is manually cleared
    this.tableSearchSubscription = this.tableSearchControl.valueChanges
      .subscribe((searchValue: string | null) => {
        // Only trigger search reset when value becomes empty (manual clearing)
        if (!searchValue || searchValue.trim() === '') {
          this.onTableSearch('');
        }
    });

    this.matchModeOptions = [
      { label: 'Contains', value: FilterMatchMode.CONTAINS },
      { label: 'Not Contains', value: FilterMatchMode.NOT_CONTAINS },
      { label: 'Starts With', value: FilterMatchMode.STARTS_WITH },
      { label: 'Ends With', value: FilterMatchMode.ENDS_WITH }
    ];

    this.exportColumns = this.tableCols.map((col) => ({ title: col.header, dataKey: col.field }));
    
    this.queryParamsSubscription = this.route.queryParams.subscribe(p => {
      this.urlSearchTerm = p['tableSearchTerm'] || '';
      if (!this.urlSearchTerm) {
        this.tableSearchControl.patchValue('', { emitEvent: false });
      }
      this.applyPendingSearch();
    });

    if (this.isLocal) {
      this.tableData = this.localTableData;
      this.originalTableData = [...this.localTableData];
      this.isDataReady = true;
    } else {
      this.tableDataSubscription = this.tableService.reportTableData$.subscribe(d => {
        if (this.isHandlingDataUpdate) return;
        this.originalTableData = d ? [...d] : [];
        if (!this.applyPendingSearch()) {
          this.tableData = d ?? [];
        }
        // Defer paginator reset to after Angular has applied the new tableData
        // binding so PrimeNG recalculates totalRecords and page links correctly.
        setTimeout(() => {
          this.first = 0;
          if (this.dt) {
            this.dt.first = 0;
            this.dt.totalRecords = this.tableData.length;
          }
        });
      });
      this.tableReadySubscription = this.tableService.reportTableDataReady$.subscribe(r => {
        this.isDataReady = r;
      });
    }
    
    this.initializeColumnVisibility();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.localTableData && this.isLocal) {
      this.originalTableData = [...this.localTableData];
    }

    if (changes.tableCols && this.tableCols && this.tableCols.length > 0) {
      this.captureDefaultColumnVisibility();
    }

    const savedColumns = this.getSavedVisibleColumnFields();
    if (savedColumns) {
      this.applySavedColumnVisibility(savedColumns);
    } else {
      this.resetVisibleColumnsToDefault();
    }

    if (changes.tableCols && this.tableCols && this.tableCols.length > 0) {
      // Re-apply search after visible columns have been restored.
      this.applyPendingSearch();
    }
    
    // Handle tableCols changes (e.g., when switching tabs)
    // if (changes.tableCols && !changes.tableCols.firstChange) {

    // } else {
      
    // }
  }

  ngOnDestroy(): void {
    this.tableService.updateReportTableData(null);
    this.tableService.updateReportTableDataReadyStatus(false);
    this.tableSearchSubscription?.unsubscribe();
    this.tableDataSubscription?.unsubscribe();
    this.tableReadySubscription?.unsubscribe();
    this.queryParamsSubscription?.unsubscribe();
  }

  private captureDefaultColumnVisibility(): void {
    this.tableCols.forEach(col => {
      if (!this.defaultColumnVisibility.has(col.field)) {
        this.defaultColumnVisibility.set(col.field, col.showColumn !== false);
      }
    });
  }

  private getSavedVisibleColumnFields(): string[] | null {
    if (!this.visibleColumnStorageKey) {
      return null;
    }

    return this.cookieService.getJsonCookie<string[]>(this.visibleColumnStorageKey);
  }

  private applySavedColumnVisibility(savedFields: string[]): void {
    const fieldSet = new Set(savedFields);
    this.tableCols.forEach(col => {
      col.showColumn = fieldSet.has(col.field);
    });
    this.initializeColumnVisibility();
  }

  private resetVisibleColumnsToDefault(): void {
    this.tableCols.forEach(col => {
      const defaultVisibility = this.defaultColumnVisibility.get(col.field);
      col.showColumn = defaultVisibility !== false;
    });

    if (this.visibleColumnStorageKey) {
      this.cookieService.deleteCookie(this.visibleColumnStorageKey);
    }

    this.initializeColumnVisibility();
  }

  private initializeColumnVisibility() {
    // Simply set visibleColumns to all columns that should be visible
    this.visibleColumns = this.tableCols.filter(col => col.showColumn !== false);
    this.pickableColumns = this.tableCols.filter(col => !col.hideFromPicker);
  }

  public resetVisibleColumns(): void {
    this.resetVisibleColumnsToDefault();
  }

  toggleVisible(e: any) {
    // Clear the visible columns array first
    this.visibleColumns = [];
    
    // Update the showColumn property for each column based on the selected items
    this.tableCols.forEach(col => {
      const isSelected = e.value.some((selectedCol: Column) => selectedCol.field === col.field);
      col.showColumn = isSelected;
      
      if (isSelected) {
        this.visibleColumns.push(col);
      }
    });

    if(this.visibleColumnStorageKey) {
      const selectedFields = this.visibleColumns.map(col => col.field).filter(field => !!field);
      this.cookieService.setJsonCookie(this.visibleColumnStorageKey, selectedFields);
    }
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
    const MIN_HEIGHT = 400;
    const MAX_HEIGHT = 600;
    const HEADER_OFFSET = 200;
    const PAGINATION_OFFSET = 100;
    
    const availableHeight = window.innerHeight - HEADER_OFFSET - PAGINATION_OFFSET;
    
    if (availableHeight < MIN_HEIGHT) {
      this.screenHeight = `${MIN_HEIGHT}px`;
    } else if (availableHeight > MAX_HEIGHT) {
      this.screenHeight = `${MAX_HEIGHT}px`;
    } else {
      this.screenHeight = `${availableHeight}px`;
    }
  }

  pageChange(event: TablePageEvent) {
    this.first = event.first;
    this.rows = event.rows;
  }

  onLazyLoad(event: TableLazyLoadEvent): void {
    if (!this.serverSidePagination) return;
    const pageSize = event.rows || this.defaultPaginationNumber;
    const page = Math.floor((event.first || 0) / pageSize) + 1;
    const sortField = (event.sortField as string) || this.defaultSortField;
    const sortOrder = event.sortOrder || this.defaultSortOrder;
    const search = this.tableSearchControl.value?.trim() || '';
    this.lazyLoadEvent.emit({ page, pageSize, sortField, sortOrder, search });
  }

  onServerSideSearch(): void {
    if (!this.serverSidePagination) return;
    const search = this.tableSearchControl.value?.trim() || '';
    const pageSize = this.rows || this.defaultPaginationNumber;
    this.first = 0;
    this.lazyLoadEvent.emit({
      page: 1,
      pageSize,
      sortField: this.defaultSortField,
      sortOrder: this.defaultSortOrder,
      search,
    });
  }

  hasPreFilteredTableData() {
    return this.preFilteredTableData && this.preFilteredTableData.length > 0;
  }

  generateColumns() {
    // Clear and rebuild visible columns based on showColumn property
    this.visibleColumns = this.tableCols.filter(col => this.showColumn(col));
  }

  public onRowSelect(e: TableRowSelectEvent) {
    if (this.expandOnRowClick && this.isRowExpandable(e.data)) {
      this.toggleRowExpansion(e.data);
      this.clearRowSelection();
      return;
    }
    e.data.tableSearchString = this.tabelSearchString || this.urlSearchTerm;
    this.rowClickEvent.emit(e.data);
    // if(this.tableType === 'globalSearch') {
    //   this.rowClickEvent.emit(e);
    //   // this.navigateByType(e.data.GEAR_Type, e.data);
    //   return;
    // } else if(this.tableType === 'accessForms') {
    //   this.rowClickEvent.emit(e);
    //   return;
    // } else {
    //   this.navigateByType(this.tableType, e.data);
    //   return;
    // }
  }


  private isRowExpandable(row: any): boolean {
    if (!this.showExpandColumn || !row) return false;
    return !this.expandableRowField || !!row[this.expandableRowField];
  }

  private toggleRowExpansion(row: any): void {
    const key = row[this.expandDataKey];
    const next = { ...this.expandedRows };
    if (next[key]) {
      delete next[key];
    } else {
      next[key] = true;
    }
    this.expandedRows = next;
  }

  // PrimeNG marks the clicked row as selected after onRowSelect fires; clear it on the
  // next tick so the expanded row isn't highlighted and the next click selects again.
  private clearRowSelection(): void {
    setTimeout(() => {
      if (!this.dt) return;
      this.dt.selection = null;
      this.dt.selectionKeys = {};
      this.dt.tableService.onSelectionChange();
    });
  }

  private navigateByType(type: string, data: any) {
    const currentRoute = this.router.url;
    const navigationMap: Record<string, { route: string; id: string; context: string }> = {
      'Investment': { route: '/investments', id: 'ID', context: '/capabilities/' },
      'investments': { route: '/investments', id: 'ID', context: '/capabilities/' },
      'Capability': { route: '/capabilities', id: 'ID', context: '/systems/' },
      'capabilities': { route: '/capabilities', id: 'ID', context: '/systems/' },
      'Organization': { route: '/organizations', id: 'ID', context: '/capabilities/' },
      'organizations': { route: '/organizations', id: 'ID', context: '/capabilities/' },
      'Website': { route: '/websites', id: 'website_id', context: '/systems/' },
      'website': { route: '/websites', id: 'website_id', context: '/systems/' },
      'records': { route: '/records_mgmt', id: 'Rec_ID', context: '/systems/' },
      'System': { route: '/systems', id: 'ID', context: '/it_standards/' },
      'systems': { route: '/systems', id: 'ID', context: '/it_standards/' },
      'time': { route: '/systems', id: 'ID', context: '/it_standards/' },
      'Technology': { route: '/it_standards', id: 'ID', context: '/systems/' },
      'itStandards': { route: '/it_standards', id: 'ID', context: '/systems/' }
    };

    const config = navigationMap[type];
    if (config) {
      if (currentRoute.includes(config.context) && !currentRoute.includes(config.route)) {
        const sourceId = currentRoute.split(config.context)[1]?.split('/')[0];
        const sourceType = config.context.includes('systems') ? 'fromSystem' : 
                          config.context.includes('capabilities') ? 'fromCapability' : 'fromTechnology';
        const sourceName = sourceType + 'Name';
        const defaultName = config.context.includes('systems') ? 'System' : 
                           config.context.includes('capabilities') ? 'Capability' : 'Technology';
        
        this.router.navigate([config.route, data[config.id]], {
          queryParams: { [sourceType]: sourceId, [sourceName]: this.contextSystemName || defaultName }
        });
      } else {
        this.router.navigate([config.route, data[config.id] || data['System Id']]);
      }
    } else {
      switch (type) {
        case 'FISMA':
        case 'fisma':
          this.router.navigate(['/FISMA', data.ID]);
          break;
        case 'fismaPoc':
          this.rowClickEvent.emit(data);
          break;
        case 'websiteServiceCategory':
          this.router.navigate(['/website_service_category', data.website_service_category_id]);
          break;
        default:
          this.rowClickEvent.emit(data);
          break;
      }
    }
  }

  isFilterButtonActive(filterButton: string) {
    //if(this.currentFilterButtons && this.currentFilterButtons.length > 0) {
    return this.currentFilterButtons.forEach(c => {
      return c === filterButton;
    });
    //}
  }

  private applyPendingSearch(): boolean {
    const term = this.urlSearchTerm || this.tableSearchControl.value?.trim();
    if (term && this.originalTableData.length > 0) {
      const searchableColumns = this.tableCols.filter(col => col.field && col.showColumn !== false);

      this.tableSearchControl.patchValue(term, { emitEvent: false });

      if (searchableColumns.length === 0) {
        return false;
      }

      this.onTableSearch(term);
      this.urlSearchTerm = '';
      return true;
    }
    return false;
  }

  onTableSearch(keyword: string) {
    if (!keyword || keyword.trim() === '') {
      // When search is empty, show all items from current filter
      this.tableData = [...this.originalTableData];
      this.isHandlingDataUpdate = true;
      this.tableService.updateReportTableData(this.tableData);
      this.isHandlingDataUpdate = false;
      this.tableService.updateReportDataTableFilterKey(null);
      return;
    }

    const searchTerm = keyword.toLowerCase().trim();
    const searchableColumns = this.tableCols.filter(col => col.field && col.showColumn !== false);
    
    // Search within the filtered/tab-selected data (originalTableData), not all data
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
    this.tabelSearchString = searchTerm;
    this.tableService.updateReportDataTableFilterKey(keyword);
  }

  onTableSearchKeypress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.onTableSearch(this.tableSearchControl.value || '');
    }
  }

  onTableSearchIconClick(): void {
    this.onTableSearch(this.tableSearchControl.value || '');
  }

  clearSearch(): void {
    this.tableSearchControl.setValue('', { emitEvent: true });
  }

  private updateOriginalData() {
    if (this.isLocal) {
      this.originalTableData = [...this.localTableData];
    } else {
      this.originalTableData = [...this.tableData];
    }
  }

  openColumnFilterModal(): void {
    this.showColumnFilterModal = true;
  }

  onColumnFilterSave(filters: ColumnFilter[]): void {
    // Clear existing filters first
    if (this.dt && this.dt.filters) {
      this.dt.filters = {};
    }
    
    // Apply new filters
    if (filters && filters.length > 0) {
      filters.forEach(filter => {
        if (this.dt && this.dt.filters && filter.value && filter.value.toString().trim() !== '') {
          this.dt.filters[filter.field] = [{ 
            value: filter.value, 
            matchMode: filter.matchMode, 
            operator: 'and' 
          }];
        }
      });
    }
    
    // Force table to refresh and apply filters
    if (this.dt) {
      // Trigger filter refresh
      this.dt._filter();
      // Reset pagination to first page
      this.dt.first = 0;
      this.first = 0;
    }
    
    this.showColumnFilterModal = false;
  }

  onColumnFilterCancel(): void {
    this.showColumnFilterModal = false;
  }

  onColumnFilterClose(): void {
    this.showColumnFilterModal = false;
  }

  clearAllColumnFilters(): void {
    if (this.dt && this.dt.filters) {
      this.dt.filters = {};
      this.dt._filter();
      this.dt.first = 0;
      this.first = 0;
    }
  }

  // Builds the CSV directly from the table's current rows (search + column filters applied)
  // rather than relying on PrimeNG's exportCSV, so row data with nested objects/arrays
  // (e.g. rollup rows) or embedded HTML always exports as plain cell values.
  exportSanitizedData() {
    if (this.exportFunction) {
      this.exportFunction();
      return;
    }

    const rows: any[] = (this.dt?.filteredValue as any[]) ?? this.tableData ?? [];
    const cols = this.tableCols.filter(col => !!col.field);

    const lines = [
      cols.map(col => this.escapeCsvField(col.header)).join(','),
      ...rows.map(row => cols.map(col => this.escapeCsvField(this.getExportValue(row, col.field))).join(','))
    ];

    const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = url;
    link.download = `${this.getExportFilename()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url));
  }

  private getExportValue(row: any, field: string): string {
    const value = field.split('.').reduce((obj, key) => (obj == null ? obj : obj[key]), row);
    if (value == null) return '';
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value)) {
      return value.map(v => (v !== null && typeof v === 'object') ? JSON.stringify(v) : String(v)).join('; ');
    }
    if (typeof value === 'object') return JSON.stringify(value);
    // Strip any HTML markup so cells contain plain text
    return String(value).replace(/<\/?[a-zA-Z][^>]*>/g, '');
  }

  escapeCsvField(field: unknown): string {
    return `"${String(field ?? '').replace(/"/g, '""')}"`;
  }

  public getTooltip (name: string): string {
    return this.sharedService.getTooltip(this.attrDefs, name);
  }
}