import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { Column } from '../../../common/table-classes';
import { FilterMatchMode } from 'primeng/api';

export interface ColumnFilter {
  field: string;
  value: any;
  matchMode: FilterMatchMode;
}

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
      // Multiple attempts to ensure scroll reset works
      this.resetScrollPosition();
      setTimeout(() => this.resetScrollPosition(), 50);
      setTimeout(() => this.resetScrollPosition(), 100);
      setTimeout(() => this.resetScrollPosition(), 200);
    }
    
    // Initialize filters with existing values if provided
    if (this.existingFilters && Object.keys(this.existingFilters).length > 0) {
      this.initializeFiltersWithExisting();
    }
  }

  private resetScrollPosition(): void {
    // Target the modal dialog with scrollable class
    const modalDialog = document.querySelector('.modal-dialog-scrollable');
    if (modalDialog) {
      modalDialog.scrollTop = 0;
    }
    
    // Also try the modal body as fallback
    const modalBody = document.querySelector('.modal-body');
    if (modalBody) {
      modalBody.scrollTop = 0;
    }
    
    // Try to scroll the modal into view at the top
    const modal = document.querySelector('.modal.show .modal-dialog');
    if (modal) {
      modal.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
  }

  private initializeFilters(): void {
    this.columns.forEach(col => {
      if (col.field && col.showColumn !== false) {
        this.columnFilters[col.field] = {
          field: col.field,
          value: '',
          matchMode: FilterMatchMode.CONTAINS
        };
      }
    });
  }

  private initializeFiltersWithExisting(): void {
    this.columns.forEach(col => {
      if (col.field && col.showColumn !== false) {
        const existingFilter = this.existingFilters[col.field];
        if (existingFilter && existingFilter.length > 0) {
          this.columnFilters[col.field] = {
            field: col.field,
            value: existingFilter[0].value || '',
            matchMode: existingFilter[0].matchMode || FilterMatchMode.CONTAINS
          };
        } else {
          this.columnFilters[col.field] = {
            field: col.field,
            value: '',
            matchMode: FilterMatchMode.CONTAINS
          };
        }
      }
    });
  }

  onSaveChanges(): void {
    const activeFilters = Object.values(this.columnFilters)
      .filter(filter => filter.value && filter.value.toString().trim() !== '');
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

  getMatchModeLabel(matchMode: FilterMatchMode): string {
    const option = this.matchModeOptions.find(opt => opt.value === matchMode);
    return option ? option.label : 'Contains';
  }
}