import { Component, EventEmitter, HostListener, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Table, TableLazyLoadEvent, TableRowSelectEvent } from 'primeng/table';
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
  @Input() contextSystemName: string = '';

  @Input() defaultPaginationNumber: number = 50;

  @Input() visibleColumnStorageKey: string = '';

  @Input() attrDefs: DataDictionary[] = [];

  // Server-side (lazy) pagination
  @Input() serverSidePagination: boolean = false;
  @Input() serverSideTotalRecords: number = 0;

  // Emits {page, pageSize, sortField, sortOrder, search} for server-side pagination
  @Output() lazyLoadEvent = new EventEmitter<{ page: number; pageSize: number; sortField: string; sortOrder: number; search: string }>();

  // Filter event (some reports change available columns when filtered)
  @Output() filterEvent = new EventEmitter<string>();

  // Row click event
  @Output() rowClickEvent = new EventEmitter<any>();

  @ViewChild(Table) private dt: Table;

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.setScreenHeight();
    this.adjustTableHeight();
  }

  @HostListener('window:orientationchange', ['$event'])
  onOrientationChange(event) {
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

  matchModeOptions: SelectItem[];

  isDataReady: boolean = false;
  // Latches true the first time data loads and never resets, so the
  // paginator's own [lazy] table isn't torn down and recreated (and its
  // lazyLoadOnInit re-triggered) every time isDataReady pulses false while
  // a later page/sort/filter refresh is in flight.
  hasEverLoaded: boolean = false;
  isSearchLoading: boolean = false;

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
      .subscribe((searchValue: string) => {
        // Only trigger search reset when value becomes empty (manual clearing)
        if (!searchValue || searchValue.trim() === '') {
          this.isSearchLoading = true;
          setTimeout(() => {
            this.onTableSearch('');
            this.isSearchLoading = false;
          }, 0);
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
      this.hasEverLoaded = true;
    } else {
      this.tableDataSubscription = this.tableService.reportTableData$.subscribe(d => {
        if (this.isHandlingDataUpdate) return;
        if (d && d.length > 0) {
          this.originalTableData = [...d];
          if (!this.applyPendingSearch()) {
            this.tableData = d;
          }
        }
      });
      this.tableReadySubscription = this.tableService.reportTableDataReady$.subscribe(r => {
        this.isDataReady = r;
        if (r) {
          this.hasEverLoaded = true;
        }
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

  pageChange(event) {
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


  private navigateByType(type: string, data: any) {
    const currentRoute = this.router.url;
    const navigationMap = {
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
    this.isSearchLoading = true;
    this.tableSearchControl.setValue('', { emitEvent: false });
    setTimeout(() => {
      this.onTableSearch('');
      this.isSearchLoading = false;
    }, 0);
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

  exportSanitizedData() {
    if(this.exportFunction) {
      this.dt.exportFunction();
    } else {
      const sanitizedData = JSON.parse(JSON.stringify(this.tableData));

      for (const row of sanitizedData) {
        for (const key in row) {
          if (Object.prototype.hasOwnProperty.call(row, key)) {
            row[key] = this.escapeCsvField(row[key]);
          }
        }
      }
      let options = { 
        selectionOnly: false,
        data: sanitizedData
       };
      this.dt.exportCSV(options);
    }
  }

  escapeCsvField(field) {
    const stringField = String(field); 
  
    const escapedField = stringField.replace(/"/g, '""');
  
    if (escapedField.includes(',') || escapedField.includes('\n') || escapedField.includes('"')) {
      return `"${escapedField}"`;
    } else {
      return escapedField;
    }
  }

  public getTooltip (name: string): string {
    const def = this.attrDefs.find(def => def.Term === name);
    if(def){
      return def.TermDefinition;
    }
    return '';
  }
}