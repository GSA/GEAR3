import {
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  TemplateRef,
  ViewChild,
  inject,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { GearPaginatorComponent } from './gear-paginator.component';
import { GearIconComponent } from './gear-icon.component';
import { FILTER_FUNCTIONS, FilterMatchMode, FilterMetadata, deepEquals, resolveFieldData } from './gear-filter';
import { clearTextSelection, isClickable, uniqueId } from './gear-dom';

export interface TablePageEvent {
  first: number;
  rows: number;
}

export interface TableLazyLoadEvent {
  first?: number;
  rows?: number;
  sortField?: string | null;
  sortOrder?: number;
  filters?: { [field: string]: FilterMetadata | FilterMetadata[] };
  last?: number;
}

export interface TableRowSelectEvent {
  originalEvent?: Event;
  data?: any;
  type?: string;
  index?: number;
}

export interface ExportCSVOptions {
  selectionOnly?: boolean;
  allValues?: boolean;
  data?: any[];
}

// Data table used by GEAR's shared report table (<app-table>). It reproduces the behaviour of
// the PrimeNG <p-table> GEAR used before - single-column sorting, column filters, pagination,
// single row selection, CSV export and the same keyboard support - and renders the same DOM
// structure so GEAR's existing table styles apply unchanged.
@Component({
  selector: 'gear-datatable',
  standalone: true,
  imports: [NgTemplateOutlet, GearPaginatorComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  host: {
    '[class]': 'hostClasses',
  },
  template: `
    @if (captionTemplate) {
      <div class="gear-datatable-header">
        <ng-container *ngTemplateOutlet="captionTemplate"></ng-container>
      </div>
    }
    <div #container class="gear-datatable-table-container" [style.max-height]="scrollable ? scrollHeight : null" style="overflow: auto">
      <table role="table" class="gear-datatable-table" [class.gear-datatable-scrollable-table]="scrollable" [attr.id]="id + '-table'">
        <thead role="rowgroup" class="gear-datatable-thead" style="position: sticky">
          <ng-container *ngTemplateOutlet="headerTemplate; context: { $implicit: columns }"></ng-container>
        </thead>
        <tbody role="rowgroup" class="gear-datatable-tbody">
          @for (rowData of dataToRender(); track rowData; let i = $index) {
            <ng-container *ngTemplateOutlet="bodyTemplate; context: { $implicit: rowData, rowIndex: paginator && !lazy ? first + i : i, columns: columns }"></ng-container>
          }
          @if (isEmpty() && emptyMessageTemplate) {
            <ng-container *ngTemplateOutlet="emptyMessageTemplate; context: { $implicit: columns }"></ng-container>
          }
        </tbody>
      </table>
    </div>
    @if (paginator) {
      <gear-paginator
        [rows]="rows"
        [first]="first"
        [totalRecords]="totalRecords"
        [rowsPerPageOptions]="rowsPerPageOptions"
        [showCurrentPageReport]="showCurrentPageReport"
        [currentPageReportTemplate]="currentPageReportTemplate"
        (pageChange)="onPageChange($event)"
      ></gear-paginator>
    }
  `,
})
export class GearDataTableComponent implements OnChanges, OnInit {
  @Input() columns: any[] = [];
  @Input() value: any[] = [];
  @Input() rows = 10;
  @Input() first = 0;
  @Input() rowsPerPageOptions: number[] = [];
  @Input() paginator = false;
  @Input() lazy = false;
  @Input() lazyLoadOnInit = true;
  @Input() totalRecords = 0;
  @Input() scrollable = false;
  @Input() scrollHeight: string | undefined;
  @Input() virtualScroll = false;
  @Input() virtualScrollItemSize: number | undefined;
  @Input() exportFilename = 'download';
  @Input() styleClass = '';
  @Input() sortField: string | null = null;
  @Input() sortOrder = 1;
  @Input() selectionMode: 'single' | null = null;
  @Input() showCurrentPageReport = false;
  @Input() currentPageReportTemplate = '{currentPage} of {totalPages}';
  @Input() exportFunction: Function | undefined;

  @Output() firstChange = new EventEmitter<number>();
  @Output() onPage = new EventEmitter<TablePageEvent>();
  @Output() onLazyLoad = new EventEmitter<TableLazyLoadEvent>();
  @Output() onRowSelect = new EventEmitter<TableRowSelectEvent>();
  @Output() onRowUnselect = new EventEmitter<TableRowSelectEvent>();

  @ContentChild('caption') captionTemplate?: TemplateRef<any>;
  @ContentChild('header') headerTemplate?: TemplateRef<any>;
  @ContentChild('body') bodyTemplate?: TemplateRef<any>;
  @ContentChild('emptymessage') emptyMessageTemplate?: TemplateRef<any>;

  @ViewChild('container') container?: ElementRef<HTMLElement>;

  readonly id = uniqueId();
  el = inject<ElementRef<HTMLElement>>(ElementRef);

  filters: { [field: string]: FilterMetadata | FilterMetadata[] } = {};
  filteredValue: any[] | null = null;
  selection: any = null;
  readonly defaultSortOrder = 1;

  private initialTotalRecords: number | undefined;
  private initialized = false;

  get hostClasses(): string {
    return [
      'gear-datatable gear-component',
      this.selectionMode ? 'gear-datatable-hoverable' : '',
      this.scrollable ? 'gear-datatable-scrollable' : '',
      this.scrollable && this.scrollHeight === 'flex' ? 'gear-datatable-flex-scrollable' : '',
      this.styleClass,
    ]
      .filter(Boolean)
      .join(' ');
  }

  get processedData(): any[] {
    return this.filteredValue || this.value || [];
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['totalRecords'] && changes['totalRecords'].firstChange) {
      this.initialTotalRecords = changes['totalRecords'].currentValue;
    }
    if (changes['value']) {
      if (!this.lazy) {
        this.totalRecords = this.initialTotalRecords === 0 && this.value ? this.value.length : this.initialTotalRecords ?? 0;
        if (this.sortField) {
          this.sortSingle();
        } else if (this.hasFilter()) {
          this._filter();
        }
      }
    }
    if (changes['sortField'] && !changes['value']) {
      if (!this.lazy || this.initialized) {
        this.sortSingle();
      }
    }
    if (changes['sortOrder'] && !changes['value'] && !changes['sortField']) {
      if (!this.lazy || this.initialized) {
        this.sortSingle();
      }
    }
  }

  ngOnInit(): void {
    if (this.lazy && this.lazyLoadOnInit) {
      this.onLazyLoad.emit(this.createLazyLoadMetadata());
    }
    this.initialized = true;
  }

  dataToRender(): any[] {
    const data = this.processedData;
    if (data && this.paginator) {
      const first = this.lazy ? 0 : this.first;
      return data.slice(first, first + this.rows);
    }
    return data;
  }

  isEmpty(): boolean {
    const data = this.filteredValue || this.value;
    return data == null || data.length === 0;
  }

  isSorted(field: string): boolean {
    return !!this.sortField && this.sortField === field;
  }

  // Header click: a new column sorts ascending, the same column toggles the direction.
  sort(field: string): void {
    this.sortOrder = this.sortField === field ? this.sortOrder * -1 : this.defaultSortOrder;
    this.sortField = field;
    this.first = 0;
    this.firstChange.emit(this.first);
    if (this.scrollable) {
      this.resetScrollTop();
    }
    this.sortSingle();
  }

  sortSingle(): void {
    const field = this.sortField;
    const order = this.sortOrder;
    if (!field || !order) {
      return;
    }
    if (this.lazy) {
      this.onLazyLoad.emit(this.createLazyLoadMetadata());
      return;
    }
    if (this.value) {
      this.value.sort((data1, data2) => {
        const value1 = resolveFieldData(data1, field);
        const value2 = resolveFieldData(data2, field);
        let result: number;
        if (value1 == null && value2 != null) result = -1;
        else if (value1 != null && value2 == null) result = 1;
        else if (value1 == null && value2 == null) result = 0;
        else if (typeof value1 === 'string' && typeof value2 === 'string') result = value1.localeCompare(value2);
        else result = value1 < value2 ? -1 : value1 > value2 ? 1 : 0;
        return order * (result || 0);
      });
      this.value = [...this.value];
    }
    if (this.hasFilter()) {
      this._filter();
    }
  }

  hasFilter(): boolean {
    return Object.keys(this.filters).length > 0;
  }

  private executeLocalFilter(field: string, rowData: any, filterMeta: FilterMetadata): boolean {
    const matchMode = filterMeta.matchMode || FilterMatchMode.STARTS_WITH;
    const constraint = FILTER_FUNCTIONS[matchMode];
    return constraint ? constraint(resolveFieldData(rowData, field), filterMeta.value) : true;
  }

  _filter(): void {
    this.first = 0;
    this.firstChange.emit(this.first);
    if (this.lazy) {
      this.onLazyLoad.emit(this.createLazyLoadMetadata());
      return;
    }
    if (!this.value) {
      return;
    }
    if (!this.hasFilter()) {
      this.filteredValue = null;
      if (this.paginator) {
        this.totalRecords = this.initialTotalRecords === 0 && this.value ? this.value.length : this.initialTotalRecords ?? 0;
      }
      return;
    }
    const filtered: any[] = [];
    for (const row of this.value) {
      let localMatch = true;
      let localFiltered = false;
      for (const field of Object.keys(this.filters)) {
        localFiltered = true;
        const meta = this.filters[field];
        if (Array.isArray(meta)) {
          for (const m of meta) {
            localMatch = this.executeLocalFilter(field, row, m);
            if ((m.operator === 'or' && localMatch) || (m.operator === 'and' && !localMatch)) {
              break;
            }
          }
        } else {
          localMatch = this.executeLocalFilter(field, row, meta);
        }
        if (!localMatch) {
          break;
        }
      }
      if (localFiltered && localMatch) {
        filtered.push(row);
      }
    }
    this.filteredValue = filtered.length === this.value.length ? null : filtered;
    if (this.paginator) {
      this.totalRecords = this.filteredValue
        ? this.filteredValue.length
        : this.initialTotalRecords === 0 && this.value
          ? this.value.length
          : this.initialTotalRecords ?? 0;
    }
  }

  reset(): void {
    this.sortField = null;
    this.sortOrder = this.defaultSortOrder;
    for (const meta of Object.values(this.filters)) {
      if (Array.isArray(meta)) {
        meta.forEach((m) => (m.value = null));
      } else if (meta) {
        meta.value = null;
      }
    }
    this.filteredValue = null;
    this.first = 0;
    this.firstChange.emit(this.first);
    if (this.lazy) {
      this.onLazyLoad.emit(this.createLazyLoadMetadata());
    } else {
      this.totalRecords = this.initialTotalRecords === 0 && this.value ? this.value.length : this.initialTotalRecords ?? 0;
    }
  }

  onPageChange(event: { first: number; rows: number }): void {
    this.first = event.first;
    this.rows = event.rows;
    this.onPage.emit({ first: this.first, rows: this.rows });
    if (this.lazy) {
      this.onLazyLoad.emit(this.createLazyLoadMetadata());
    }
    this.firstChange.emit(this.first);
    if (this.scrollable) {
      this.resetScrollTop();
    }
  }

  createLazyLoadMetadata(): TableLazyLoadEvent {
    return {
      first: this.first,
      rows: this.rows,
      sortField: this.sortField,
      sortOrder: this.sortOrder,
      filters: this.filters,
      last: this.first + this.rows,
    };
  }

  resetScrollTop(): void {
    this.container?.nativeElement.scrollTo({ top: 0 });
  }

  isSelected(rowData: any): boolean {
    return !!rowData && !!this.selection && deepEquals(rowData, this.selection);
  }

  handleRowClick(event: Event, rowData: any, rowIndex: number | undefined): void {
    if (isClickable(event.target as Element)) {
      return;
    }
    if (!this.selectionMode) {
      return;
    }
    if (this.isSelected(rowData)) {
      this.selection = null;
      this.onRowUnselect.emit({ originalEvent: event, data: rowData, type: 'row', index: rowIndex });
    } else {
      this.selection = rowData;
      this.onRowSelect.emit({ originalEvent: event, data: rowData, type: 'row', index: rowIndex });
    }
  }

  // Exports the rows currently shown by the table (after sorting/filtering) as CSV, exactly as
  // PrimeNG's exportCSV did: every column that has a field, values quoted, UTF-8 with BOM.
  exportCSV(options?: ExportCSVOptions): void {
    let data: any[];
    if (options && options.selectionOnly) {
      data = this.selection ? [this.selection] : [];
    } else if (options && options.allValues) {
      data = this.value || [];
    } else {
      data = this.filteredValue || this.value || [];
    }
    const exportableColumns = (this.columns || []).filter((column) => column.exportable !== false && column.field);
    let csv = exportableColumns.map((column) => '"' + (column.header || column.field) + '"').join(',');
    const body = data
      .map((record) =>
        exportableColumns
          .map((column) => {
            let cellData = resolveFieldData(record, column.field);
            if (cellData != null) {
              cellData = this.exportFunction ? this.exportFunction({ data: cellData, field: column.field }) : String(cellData).replace(/"/g, '""');
            } else {
              cellData = '';
            }
            return '"' + cellData + '"';
          })
          .join(','),
      )
      .join('\n');
    if (body.length) {
      csv += '\n' + body;
    }
    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.style.display = 'none';
    document.body.appendChild(link);
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', this.exportFilename + '.csv');
    link.click();
    document.body.removeChild(link);
  }
}

// Makes a header cell sortable: click / Enter / Space sorts by the column and the cell exposes
// aria-sort, matching PrimeNG's pSortableColumn.
@Directive({
  selector: '[gearSortableColumn]',
  standalone: true,
  host: {
    role: 'columnheader',
    '[class.gear-datatable-sortable-column]': 'isEnabled()',
    '[class.gear-datatable-column-sorted]': 'sorted',
    // PrimeNG bound the tabIndex *property*, so non-sortable headers ended up focusable (null
    // coerces to 0) without aria-sort. Keep that so keyboard tab order is unchanged.
    tabindex: '0',
    '[attr.aria-sort]': 'isEnabled() ? ariaSort : null',
  },
})
export class GearSortableColumnDirective {
  @Input('gearSortableColumn') field = '';
  @Input() gearSortableColumnDisabled = false;

  private table = inject(GearDataTableComponent);

  isEnabled(): boolean {
    return this.gearSortableColumnDisabled !== true;
  }

  get sorted(): boolean {
    return this.isEnabled() && this.table.isSorted(this.field);
  }

  get ariaSort(): string {
    if (!this.table.isSorted(this.field)) return 'none';
    return this.table.sortOrder === 1 ? 'ascending' : 'descending';
  }

  @HostListener('click')
  onClick(): void {
    if (this.isEnabled()) {
      this.table.sort(this.field);
      clearTextSelection();
    }
  }

  @HostListener('keydown.enter', ['$event'])
  @HostListener('keydown.space', ['$event'])
  onEnterKey(event: Event): void {
    this.onClick();
    event.preventDefault();
  }
}

@Component({
  selector: 'gear-sorticon',
  standalone: true,
  imports: [GearIconComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  host: { class: 'gear-sorticon' },
  template: `
    @if (order === 0) {
      <svg gearIcon="sort-alt" class="gear-datatable-sort-icon gear-icon"></svg>
    } @else if (order === 1) {
      <svg gearIcon="sort-amount-up-alt" class="gear-datatable-sort-icon gear-icon"></svg>
    } @else {
      <svg gearIcon="sort-amount-down" class="gear-datatable-sort-icon gear-icon"></svg>
    }
  `,
})
export class GearSortIconComponent {
  @Input() field = '';

  private table = inject(GearDataTableComponent);

  get order(): number {
    return this.table.isSorted(this.field) ? this.table.sortOrder : 0;
  }
}

// Row selection + keyboard navigation for body rows, matching PrimeNG's pSelectableRow.
@Directive({
  selector: '[gearSelectableRow]',
  standalone: true,
  host: {
    '[class.gear-datatable-selectable-row]': 'true',
    '[class.gear-datatable-row-selected]': 'table.isSelected(data)',
    'data-gear-selectable-row': 'true',
    tabindex: '0',
  },
})
export class GearSelectableRowDirective {
  @Input('gearSelectableRow') data: any;
  @Input() gearSelectableRowIndex: number | undefined;

  table = inject(GearDataTableComponent);
  private el = inject<ElementRef<HTMLElement>>(ElementRef);

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    this.table.handleRowClick(event, this.data, this.gearSelectableRowIndex);
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    const row = this.el.nativeElement;
    const rows = () => Array.from(this.table.el.nativeElement.querySelectorAll<HTMLElement>('[data-gear-selectable-row="true"]'));
    switch (event.code) {
      case 'ArrowDown': {
        const next = row.nextElementSibling as HTMLElement | null;
        next?.focus();
        event.preventDefault();
        break;
      }
      case 'ArrowUp': {
        const prev = row.previousElementSibling as HTMLElement | null;
        prev?.focus();
        event.preventDefault();
        break;
      }
      case 'Home': {
        const first = rows()[0];
        if (first) this.focusRowChange(row, first);
        event.preventDefault();
        break;
      }
      case 'End': {
        const all = rows();
        const last = all[all.length - 1];
        if (last) this.focusRowChange(row, last);
        event.preventDefault();
        break;
      }
      case 'Space': {
        const t = event.target;
        if (t instanceof HTMLInputElement || t instanceof HTMLSelectElement || t instanceof HTMLTextAreaElement) {
          return;
        }
        this.table.handleRowClick(event, this.data, this.gearSelectableRowIndex);
        event.preventDefault();
        break;
      }
      case 'Enter':
        this.table.handleRowClick(event, this.data, this.gearSelectableRowIndex);
        break;
    }
  }

  private focusRowChange(current: HTMLElement, target: HTMLElement): void {
    current.tabIndex = -1;
    target.tabIndex = 0;
    target.focus();
  }
}
