import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnDestroy,
  Output,
  ViewChild,
  inject,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { GearIconComponent } from './gear-icon.component';
import { GearRippleDirective } from './gear-ripple.directive';
import { GearConnectedOverlay } from './gear-overlay';
import { uniqueId } from './gear-dom';

// Single-value dropdown used for the "rows per page" selector. Same markup/classes as the
// PrimeNG <p-select> so its look, keyboard behaviour and overlay placement are unchanged.
@Component({
  selector: 'gear-select',
  standalone: true,
  imports: [NgClass, GearIconComponent, GearRippleDirective],
  changeDetection: ChangeDetectionStrategy.Eager,
  host: {
    '[class]': 'hostClasses',
    '[style.position]': '"relative"',
    '(click)': 'onContainerClick($event)',
  },
  template: `
    <span
      #focusInput
      class="gear-select-label"
      role="combobox"
      [attr.aria-label]="ariaLabel"
      aria-haspopup="listbox"
      [attr.aria-expanded]="open"
      [attr.aria-controls]="open ? id + '_list' : null"
      [attr.aria-disabled]="disabled"
      [attr.tabindex]="disabled ? -1 : 0"
      [attr.aria-activedescendant]="focused && focusedIndex !== -1 ? id + '_' + focusedIndex : null"
      (focus)="focused = true"
      (blur)="focused = false"
      (keydown)="onKeyDown($event)"
      >{{ selectedLabel }}</span
    >
    <div class="gear-select-dropdown" role="button" aria-label="dropdown trigger" aria-haspopup="listbox" [attr.aria-expanded]="open">
      <svg gearIcon="chevron-down" class="gear-select-dropdown-icon gear-icon"></svg>
    </div>
    @if (open) {
      <div #wrapper class="gear-overlay gear-component" style="position: absolute; top: 0" (click)="overlay.markOverlayClick()">
        <div class="gear-select-overlay gear-component-overlay gear-component" (click)="$event.stopPropagation(); overlay.markOverlayClick()">
          <div class="gear-select-list-container" [style.max-height]="scrollHeight">
            <ul class="gear-select-list" role="listbox" [attr.id]="id + '_list'" aria-label="Option List">
              @for (option of options; track option; let i = $index) {
                <li
                  gearRipple
                  role="option"
                  class="gear-select-option"
                  [ngClass]="{ 'gear-select-option-selected': option === value, 'gear-focus': focusedIndex === i }"
                  [attr.id]="id + '_' + i"
                  [attr.aria-label]="option"
                  [attr.aria-setsize]="options.length"
                  [attr.aria-posinset]="i + 1"
                  [attr.aria-selected]="option === value"
                  (click)="select(option)"
                  (mousemove)="focusedIndex = i"
                >
                  <span>{{ option }}</span>
                </li>
              }
            </ul>
          </div>
        </div>
      </div>
    }
  `,
})
export class GearSelectComponent implements OnDestroy {
  @Input() options: number[] = [];
  @Input() value: number | null = null;
  @Input() ariaLabel = '';
  @Input() disabled = false;
  @Input() scrollHeight = '200px';
  @Input() styleClass = '';

  @Output() valueChange = new EventEmitter<number>();

  @ViewChild('focusInput') focusInput?: ElementRef<HTMLElement>;
  @ViewChild('wrapper') set wrapperRef(ref: ElementRef<HTMLElement> | undefined) {
    this.wrapperEl = ref?.nativeElement ?? null;
    if (this.wrapperEl) {
      this.overlay.opened();
    }
  }

  readonly id = uniqueId();
  open = false;
  focused = false;
  focusedIndex = -1;

  private el = inject<ElementRef<HTMLElement>>(ElementRef);
  private zone = inject(NgZone);
  private wrapperEl: HTMLElement | null = null;
  overlay = new GearConnectedOverlay(
    this.zone,
    () => this.el.nativeElement,
    () => this.wrapperEl,
    () => this.hide(),
  );

  get hostClasses(): string {
    return [
      'gear-select gear-component gear-inputwrapper',
      this.value !== null && this.value !== undefined ? 'gear-inputwrapper-filled' : '',
      this.focused ? 'gear-focus' : '',
      this.focused || this.open ? 'gear-inputwrapper-focus' : '',
      this.open ? 'gear-select-open' : '',
      this.disabled ? 'gear-disabled' : '',
      this.styleClass,
    ]
      .filter(Boolean)
      .join(' ');
  }

  get selectedLabel(): string {
    return this.value === null || this.value === undefined ? '\u00a0' : String(this.value);
  }

  onContainerClick(event: MouseEvent): void {
    if (this.disabled || (this.wrapperEl && this.wrapperEl.contains(event.target as Node))) {
      return;
    }
    this.focusInput?.nativeElement.focus({ preventScroll: true });
    this.open ? this.hide() : this.show();
  }

  show(): void {
    if (this.open) return;
    this.focusedIndex = this.options.indexOf(this.value as number);
    this.open = true;
  }

  hide(): void {
    if (!this.open) return;
    this.overlay.closed();
    this.open = false;
    this.wrapperEl = null;
  }

  select(option: number): void {
    this.value = option;
    this.valueChange.emit(option);
    this.hide();
    this.focusInput?.nativeElement.focus({ preventScroll: true });
  }

  onKeyDown(event: KeyboardEvent): void {
    if (this.disabled) return;
    switch (event.code) {
      case 'ArrowDown':
        if (!this.open) {
          this.show();
        } else {
          this.focusedIndex = Math.min(this.options.length - 1, this.focusedIndex + 1);
        }
        event.preventDefault();
        break;
      case 'ArrowUp':
        if (event.altKey) {
          if (this.focusedIndex !== -1) this.select(this.options[this.focusedIndex]);
          this.hide();
        } else if (this.open) {
          this.focusedIndex = Math.max(0, this.focusedIndex - 1);
        } else {
          this.show();
        }
        event.preventDefault();
        break;
      case 'Home':
        if (this.open) this.focusedIndex = 0;
        event.preventDefault();
        break;
      case 'End':
        if (this.open) this.focusedIndex = this.options.length - 1;
        event.preventDefault();
        break;
      case 'Enter':
      case 'NumpadEnter':
      case 'Space':
        if (!this.open) {
          this.show();
        } else if (this.focusedIndex !== -1) {
          this.select(this.options[this.focusedIndex]);
        }
        event.preventDefault();
        break;
      case 'Escape':
        if (this.open) {
          this.hide();
          event.preventDefault();
        }
        break;
      case 'Tab':
        if (this.open) {
          if (this.focusedIndex !== -1) this.select(this.options[this.focusedIndex]);
          this.hide();
        }
        break;
    }
  }

  ngOnDestroy(): void {
    this.hide();
  }
}

// Paginator matching PrimeNG's: "Showing x to y of z entries" report, first/prev, five page
// links centred on the current page, next/last and the rows-per-page selector.
@Component({
  selector: 'gear-paginator',
  standalone: true,
  imports: [NgClass, GearIconComponent, GearRippleDirective, GearSelectComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  host: { class: 'gear-paginator gear-component' },
  template: `
    @if (showCurrentPageReport) {
      <span class="gear-paginator-current">{{ currentPageReport }}</span>
    }
    <button gearRipple type="button" class="gear-paginator-first" [ngClass]="{ 'gear-disabled': isFirstPage() || empty() }" aria-label="First Page" (click)="changePageToFirst($event)">
      <svg gearIcon="angle-double-left" class="gear-paginator-first-icon gear-icon"></svg>
    </button>
    <button gearRipple type="button" class="gear-paginator-prev" [ngClass]="{ 'gear-disabled': isFirstPage() || empty() }" [disabled]="isFirstPage() || empty()" aria-label="Previous Page" (click)="changePage(getPage() - 1, $event)">
      <svg gearIcon="angle-left" class="gear-paginator-prev-icon gear-icon"></svg>
    </button>
    <span class="gear-paginator-pages">
      @for (pageLink of pageLinks; track pageLink) {
        <button
          gearRipple
          type="button"
          class="gear-paginator-page"
          [ngClass]="{ 'gear-paginator-page-selected': pageLink - 1 === getPage() }"
          [attr.aria-label]="pageLink"
          [attr.aria-current]="pageLink - 1 === getPage() ? 'page' : null"
          (click)="changePage(pageLink - 1, $event)"
        >
          {{ pageLink }}
        </button>
      }
    </span>
    <button gearRipple type="button" class="gear-paginator-next" [ngClass]="{ 'gear-disabled': isLastPage() || empty() }" [disabled]="isLastPage() || empty()" aria-label="Next Page" (click)="changePage(getPage() + 1, $event)">
      <svg gearIcon="angle-right" class="gear-paginator-next-icon gear-icon"></svg>
    </button>
    <button gearRipple type="button" class="gear-paginator-last" [ngClass]="{ 'gear-disabled': isLastPage() || empty() }" [disabled]="isLastPage() || empty()" aria-label="Last Page" (click)="changePageToLast($event)">
      <svg gearIcon="angle-double-right" class="gear-paginator-last-icon gear-icon"></svg>
    </button>
    @if (rowsPerPageOptions.length) {
      <gear-select
        styleClass="gear-paginator-rpp-dropdown"
        ariaLabel="Rows per page"
        [options]="rowsPerPageOptions"
        [value]="rows"
        [disabled]="empty()"
        (valueChange)="onRowsChange($event)"
      ></gear-select>
    }
  `,
})
export class GearPaginatorComponent {
  @Input() totalRecords = 0;
  @Input() rows = 10;
  @Input() first = 0;
  @Input() rowsPerPageOptions: number[] = [];
  @Input() showCurrentPageReport = true;
  @Input() currentPageReportTemplate = 'Showing {first} to {last} of {totalRecords} entries';
  @Input() pageLinkSize = 5;

  @Output() pageChange = new EventEmitter<{ first: number; rows: number; page: number; pageCount: number }>();

  get pageLinks(): number[] {
    const numberOfPages = this.getPageCount();
    const visiblePages = Math.min(this.pageLinkSize, numberOfPages);
    let start = Math.max(0, Math.ceil(this.getPage() - visiblePages / 2));
    const end = Math.min(numberOfPages - 1, start + visiblePages - 1);
    const delta = this.pageLinkSize - (end - start + 1);
    start = Math.max(0, start - delta);
    const links: number[] = [];
    for (let i = start; i <= end; i++) links.push(i + 1);
    return links;
  }

  get currentPageReport(): string {
    return this.currentPageReportTemplate
      .replace('{currentPage}', String(this.getPageCount() > 0 ? this.getPage() + 1 : 0))
      .replace('{totalPages}', String(this.getPageCount()))
      .replace('{first}', String(this.totalRecords > 0 ? this.first + 1 : 0))
      .replace('{last}', String(Math.min(this.first + this.rows, this.totalRecords)))
      .replace('{rows}', String(this.rows))
      .replace('{totalRecords}', String(this.totalRecords));
  }

  getPageCount(): number {
    return Math.ceil(this.totalRecords / this.rows);
  }

  getPage(): number {
    return Math.floor(this.first / this.rows);
  }

  isFirstPage(): boolean {
    return this.getPage() === 0;
  }

  isLastPage(): boolean {
    return this.getPage() === this.getPageCount() - 1;
  }

  empty(): boolean {
    return this.getPageCount() === 0;
  }

  changePage(p: number, event?: Event): void {
    event?.preventDefault();
    const pc = this.getPageCount();
    if (p >= 0 && p < pc) {
      this.first = this.rows * p;
      this.pageChange.emit({ page: p, first: this.first, rows: this.rows, pageCount: pc });
    }
  }

  changePageToFirst(event: Event): void {
    if (!this.isFirstPage()) this.changePage(0);
    event.preventDefault();
  }

  changePageToLast(event: Event): void {
    if (!this.isLastPage()) this.changePage(this.getPageCount() - 1);
    event.preventDefault();
  }

  onRowsChange(rows: number): void {
    this.rows = rows;
    const pc = this.getPageCount();
    const page = Math.max(0, Math.min(this.getPage(), pc - 1));
    this.first = this.rows * page;
    this.pageChange.emit({ page, first: this.first, rows: this.rows, pageCount: pc });
  }
}
