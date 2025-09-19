import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { Column, ColumnFilter } from '../../../common/table-classes';
import { FilterMatchMode } from 'primeng/api';

@Component({
  selector: 'table-column-filter-modal',
  templateUrl: './table-column-filter-modal.component.html',
  styleUrls: ['./table-column-filter-modal.component.scss'],
  standalone: false
})
export class TableColumnFilterModalComponent implements OnInit, OnChanges {

  @Input() columns: Column[] = [];
  @Input() isVisible: boolean = false;
  @Input() existingFilters: any = {};
  @Output() saveChanges = new EventEmitter<ColumnFilter[]>();
  @Output() cancelChanges = new EventEmitter<void>();
  @Output() closeModal = new EventEmitter<void>();

  columnFilters: { [key: string]: ColumnFilter } = {};
  matchModeOptions = [
    { label: 'Contains', value: FilterMatchMode.CONTAINS },
    { label: 'Not Contains', value: FilterMatchMode.NOT_CONTAINS },
    { label: 'Starts With', value: FilterMatchMode.STARTS_WITH },
    { label: 'Ends With', value: FilterMatchMode.ENDS_WITH },
    { label: 'Equals', value: FilterMatchMode.EQUALS },
    { label: 'Not Equals', value: FilterMatchMode.NOT_EQUALS }
  ];

  constructor() { }

  ngOnInit(): void {
    this.initializeFilters();
  }

  ngOnChanges(): void {
    if (this.isVisible) {
      this.initializeFilters();
    }
  }

  private initializeFilters(): void {
    this.columns.forEach(col => {
      if (col.field && col.showColumn !== false) {
        const existingFilter = this.existingFilters[col.field];
        this.columnFilters[col.field] = {
          field: col.field,
          value: existingFilter ? existingFilter[0]?.value || '' : '',
          matchMode: existingFilter ? existingFilter[0]?.matchMode || FilterMatchMode.CONTAINS as string : FilterMatchMode.CONTAINS as string
        };
      }
    });
  }

  onSaveChanges(): void {
    const activeFilters = Object.values(this.columnFilters)
      .filter(filter => filter.value && filter.value.toString().trim() !== '')
      .map(filter => ({
        ...filter,
        value: filter.value.toString().trim()
      }));
    this.saveChanges.emit(activeFilters);
    this.closeModal.emit();
  }

  onCancelChanges(): void {
    this.initializeFilters();
    this.cancelChanges.emit();
    this.closeModal.emit();
  }

  onCloseModal(): void {
    this.closeModal.emit();
  }

  clearAllFilters(): void {
    Object.keys(this.columnFilters).forEach(key => {
      this.columnFilters[key].value = '';
    });
  }

  clearColumnFilter(field: string): void {
    if (this.columnFilters[field]) {
      this.columnFilters[field].value = '';
    }
  }

  hasActiveFilters(): boolean {
    return Object.values(this.columnFilters).some(filter => 
      filter.value && filter.value.toString().trim() !== ''
    );
  }

  getColumnLabel(field: string): string {
    const column = this.columns.find(col => col.field === field);
    return column ? column.header : field;
  }

  getActiveFilters(): ColumnFilter[] {
    return Object.values(this.columnFilters)
      .filter(filter => filter.value && filter.value.toString().trim() !== '');
  }

  getMatchModeLabel(matchMode: string): string {
    const option = this.matchModeOptions.find(opt => opt.value === matchMode);
    return option ? option.label : 'Contains';
  }
}