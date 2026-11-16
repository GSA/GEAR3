import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnDestroy,
  ViewChild,
  forwardRef,
  inject,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { GearIconComponent } from './gear-icon.component';
import { GearButtonComponent } from './gear-button.component';
import { GearRippleDirective } from './gear-ripple.directive';
import { GearConnectedOverlay } from './gear-overlay';
import { relativePosition } from './gear-dom';

interface DateMeta {
  day: number;
  month: number;
  year: number;
  otherMonth?: boolean;
  today: boolean;
  selectable: boolean;
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_NAMES_MIN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// Single-date picker for the IT Standards Manager "Approval Expires" field: text input in
// mm/dd/yyyy format with a calendar icon, a day/month/year calendar popup and a Today/Clear
// button bar. Look and behaviour match the PrimeNG <p-datepicker> it replaces.
@Component({
  selector: 'gear-datepicker',
  standalone: true,
  imports: [NgClass, GearIconComponent, GearButtonComponent, GearRippleDirective],
  changeDetection: ChangeDetectionStrategy.Eager,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => GearDatePickerComponent), multi: true }],
  host: {
    '[class]': 'hostClasses',
    '[style.position]': '"relative"',
  },
  template: `
    <input
      #inputfield
      type="text"
      role="combobox"
      aria-autocomplete="none"
      aria-haspopup="dialog"
      autocomplete="off"
      class="gear-datepicker-input gear-component gear-inputtext"
      [ngClass]="{ 'gear-filled': !!value, 'gear-inputtext-fluid': fluid }"
      [attr.id]="inputId || null"
      [attr.aria-expanded]="open"
      [attr.placeholder]="placeholder || null"
      [disabled]="disabled"
      [value]="inputValue"
      (focus)="onInputFocus()"
      (click)="onInputClick()"
      (blur)="onInputBlur()"
      (keydown)="onInputKeyDown($event)"
      (input)="onUserInput($event)"
    />
    @if (showIcon) {
      <span class="gear-datepicker-input-icon-container" (click)="onIconClick()">
        <svg gearIcon="calendar" class="gear-datepicker-input-icon gear-icon"></svg>
      </span>
    }
    @if (open) {
      <div #wrapper class="gear-overlay gear-component" style="position: absolute; top: 0" (mousedown)="overlay.markOverlayClick()" (click)="overlay.markOverlayClick()">
        <div class="gear-component gear-datepicker-panel" role="dialog" aria-modal="true" aria-label="Choose Date" (click)="$event.stopPropagation(); overlay.markOverlayClick()">
          <div class="gear-datepicker-calendar-container">
            <div class="gear-datepicker-calendar">
              <div class="gear-datepicker-header">
                <gear-button
                  variant="text"
                  severity="secondary"
                  [iconOnly]="true"
                  styleClass="gear-button-rounded gear-datepicker-prev-button"
                  ariaLabel="Previous Month"
                  (onClick)="navBackward($event)"
                  ><svg gearIcon="chevron-left" class="gear-icon"></svg
                ></gear-button>
                <div class="gear-datepicker-title">
                  @if (currentView === 'date') {
                    <button gearRipple type="button" class="gear-datepicker-select-month" aria-label="Choose Month" (click)="setView('month')">
                      {{ monthNames[currentMonth] }}
                    </button>
                  }
                  @if (currentView !== 'year') {
                    <button gearRipple type="button" class="gear-datepicker-select-year" aria-label="Choose Year" (click)="setView('year')">
                      {{ currentYear }}
                    </button>
                  }
                  @if (currentView === 'year') {
                    <span class="gear-datepicker-decade">{{ yearPickerValues[0] }} - {{ yearPickerValues[yearPickerValues.length - 1] }}</span>
                  }
                </div>
                <gear-button
                  variant="text"
                  severity="secondary"
                  [iconOnly]="true"
                  styleClass="gear-button-rounded gear-datepicker-next-button"
                  ariaLabel="Next Month"
                  (onClick)="navForward($event)"
                  ><svg gearIcon="chevron-right" class="gear-icon"></svg
                ></gear-button>
              </div>
              @if (currentView === 'date') {
                <table role="grid" class="gear-datepicker-day-view">
                  <thead>
                    <tr>
                      @for (d of dayNames; track d) {
                        <th scope="col" class="gear-datepicker-weekday-cell"><span class="gear-datepicker-weekday">{{ d }}</span></th>
                      }
                    </tr>
                  </thead>
                  <tbody>
                    @for (week of weeks; track $index) {
                      <tr>
                        @for (date of week; track $index) {
                          <td class="gear-datepicker-day-cell" [ngClass]="{ 'gear-datepicker-other-month': date.otherMonth, 'gear-datepicker-today': date.today }" [attr.aria-label]="date.day">
                            <span
                              gearRipple
                              draggable="false"
                              class="gear-datepicker-day"
                              [ngClass]="{ 'gear-datepicker-day-selected': isSelected(date), 'gear-disabled': disabled || !date.selectable }"
                              tabindex="-1"
                              (click)="onDateSelect(date)"
                              (keydown.enter)="onDateSelect(date)"
                              >{{ date.day }}</span
                            >
                            @if (isSelected(date)) {
                              <div class="gear-hidden-accessible" aria-live="polite">{{ date.day }}</div>
                            }
                          </td>
                        }
                      </tr>
                    }
                  </tbody>
                </table>
              }
            </div>
          </div>
          @if (currentView === 'month') {
            <div class="gear-datepicker-month-view">
              @for (m of monthNamesShort; track m; let i = $index) {
                <span gearRipple tabindex="-1" class="gear-datepicker-month" [ngClass]="{ 'gear-datepicker-month-selected': isMonthSelected(i) }" (click)="onMonthSelect(i)">{{ m }}</span>
              }
            </div>
          }
          @if (currentView === 'year') {
            <div class="gear-datepicker-year-view">
              @for (y of yearPickerValues; track y) {
                <span gearRipple tabindex="-1" class="gear-datepicker-year" [ngClass]="{ 'gear-datepicker-year-selected': isYearSelected(y) }" (click)="onYearSelect(y)">{{ y }}</span>
              }
            </div>
          }
          @if (showButtonBar) {
            <div class="gear-datepicker-buttonbar">
              <gear-button label="Today" size="small" severity="secondary" variant="text" styleClass="gear-datepicker-today-button" (onClick)="onTodayButtonClick()"></gear-button>
              <gear-button label="Clear" size="small" severity="secondary" variant="text" styleClass="gear-datepicker-clear-button" (onClick)="onClearButtonClick()"></gear-button>
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class GearDatePickerComponent implements ControlValueAccessor, OnDestroy {
  @Input() showIcon = false;
  @Input() showButtonBar = false;
  @Input() fluid = false;
  @Input() placeholder = '';
  @Input() inputId = '';
  @Input() disabled = false;

  @ViewChild('inputfield') inputfield?: ElementRef<HTMLInputElement>;
  @ViewChild('wrapper') set wrapperRef(ref: ElementRef<HTMLElement> | undefined) {
    this.wrapperEl = ref?.nativeElement ?? null;
    if (this.wrapperEl) {
      this.overlay.opened();
    }
  }

  readonly monthNames = MONTH_NAMES;
  readonly monthNamesShort = MONTH_NAMES_SHORT;
  readonly dayNames = DAY_NAMES_MIN;

  value: Date | null = null;
  inputValue = '';
  open = false;
  focused = false;
  currentView: 'date' | 'month' | 'year' = 'date';
  currentMonth = new Date().getMonth();
  currentYear = new Date().getFullYear();
  weeks: DateMeta[][] = [];

  private el = inject<ElementRef<HTMLElement>>(ElementRef);
  private zone = inject(NgZone);
  private cd = inject(ChangeDetectorRef);
  private wrapperEl: HTMLElement | null = null;
  private preventFocusOpen = false;
  private isKeydown = false;
  private onModelChange: (v: Date | null) => void = () => {};
  private onModelTouched: () => void = () => {};

  overlay = new GearConnectedOverlay(
    this.zone,
    () => this.el.nativeElement,
    () => this.wrapperEl,
    () => this.hideOverlay(false),
  );

  get hostClasses(): string {
    return [
      'gear-component gear-datepicker gear-inputwrapper',
      this.fluid ? 'gear-datepicker-fluid' : '',
      this.value ? 'gear-inputwrapper-filled' : '',
      this.focused ? 'gear-focus gear-inputwrapper-focus' : '',
      this.disabled ? 'gear-disabled' : '',
    ]
      .filter(Boolean)
      .join(' ');
  }

  get yearPickerValues(): number[] {
    const base = this.currentYear - (this.currentYear % 10);
    return Array.from({ length: 10 }, (_, i) => base + i);
  }

  writeValue(v: any): void {
    this.value = v instanceof Date && !isNaN(v.getTime()) ? v : v ? this.toDate(v) : null;
    this.updateInputfield();
    this.updateUI();
  }

  registerOnChange(fn: (v: Date | null) => void): void {
    this.onModelChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onModelTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  private toDate(v: any): Date | null {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }

  private pad(n: number): string {
    return n < 10 ? '0' + n : String(n);
  }

  private formatDate(d: Date): string {
    return `${this.pad(d.getMonth() + 1)}/${this.pad(d.getDate())}/${d.getFullYear()}`;
  }

  // Parses the "mm/dd/yy" format PrimeNG used (which renders a four digit year).
  private parseDate(text: string): Date {
    const parts = text.trim().split('/');
    if (parts.length !== 3) throw new Error('Invalid date');
    const [m, d, y] = parts.map((p) => parseInt(p, 10));
    let year = y;
    if (parts[2].length <= 2) {
      const cutoff = (new Date().getFullYear() % 100) + 10;
      year = y + (new Date().getFullYear() - (new Date().getFullYear() % 100) + (y <= cutoff ? 0 : -100));
    }
    const date = new Date(year, m - 1, d);
    if (isNaN(date.getTime()) || date.getMonth() !== m - 1 || date.getDate() !== d) {
      throw new Error('Invalid date');
    }
    return date;
  }

  private updateInputfield(): void {
    this.inputValue = this.value ? this.formatDate(this.value) : '';
    if (this.inputfield) {
      this.inputfield.nativeElement.value = this.inputValue;
    }
  }

  private updateUI(): void {
    const val = this.value ?? new Date();
    this.currentMonth = val.getMonth();
    this.currentYear = val.getFullYear();
    this.createMonth();
  }

  private createMonth(): void {
    const month = this.currentMonth;
    const year = this.currentYear;
    const today = new Date();
    const firstDay = new Date(year, month, 1).getDay();
    const daysLength = 32 - new Date(year, month, 32).getDate();
    const prev = month === 0 ? { month: 11, year: year - 1 } : { month: month - 1, year };
    const next = month === 11 ? { month: 0, year: year + 1 } : { month: month + 1, year };
    const prevMonthDaysLength = 32 - new Date(prev.year, prev.month, 32).getDate();
    const isToday = (d: number, m: number, y: number) => today.getDate() === d && today.getMonth() === m && today.getFullYear() === y;
    const weeks: DateMeta[][] = [];
    let dayNo = 1;
    const monthRows = Math.ceil((daysLength + firstDay) / 7);
    for (let i = 0; i < monthRows; i++) {
      const week: DateMeta[] = [];
      if (i === 0) {
        for (let j = prevMonthDaysLength - firstDay + 1; j <= prevMonthDaysLength; j++) {
          week.push({ day: j, month: prev.month, year: prev.year, otherMonth: true, today: isToday(j, prev.month, prev.year), selectable: false });
        }
        const remaining = 7 - week.length;
        for (let j = 0; j < remaining; j++) {
          week.push({ day: dayNo, month, year, today: isToday(dayNo, month, year), selectable: true });
          dayNo++;
        }
      } else {
        for (let j = 0; j < 7; j++) {
          if (dayNo > daysLength) {
            const d = dayNo - daysLength;
            week.push({ day: d, month: next.month, year: next.year, otherMonth: true, today: isToday(d, next.month, next.year), selectable: false });
          } else {
            week.push({ day: dayNo, month, year, today: isToday(dayNo, month, year), selectable: true });
          }
          dayNo++;
        }
      }
      weeks.push(week);
    }
    this.weeks = weeks;
  }

  isSelected(date: DateMeta): boolean {
    return !!this.value && date.selectable && this.value.getDate() === date.day && this.value.getMonth() === date.month && this.value.getFullYear() === date.year;
  }

  isMonthSelected(month: number): boolean {
    return !!this.value && this.value.getMonth() === month && this.value.getFullYear() === this.currentYear;
  }

  isYearSelected(year: number): boolean {
    return !!this.value && this.value.getFullYear() === year;
  }

  private updateModel(value: Date | null): void {
    this.value = value;
    this.onModelChange(value);
  }

  onDateSelect(date: DateMeta): void {
    if (this.disabled || !date.selectable) return;
    this.updateModel(new Date(date.year, date.month, date.day));
    this.updateInputfield();
    setTimeout(() => this.hideOverlay(), 150);
  }

  onMonthSelect(index: number): void {
    this.currentMonth = index;
    this.createMonth();
    this.setView('date');
  }

  onYearSelect(year: number): void {
    this.currentYear = year;
    this.setView('month');
  }

  // Switching between day/month/year views re-aligns the popup (it changes height) and, for
  // the month and year grids, moves focus to the first cell - as the PrimeNG datepicker did.
  setView(view: 'date' | 'month' | 'year'): void {
    this.currentView = view;
    this.cd.detectChanges();
    if (this.wrapperEl) {
      relativePosition(this.wrapperEl, this.el.nativeElement);
      let cell: HTMLElement | null = null;
      if (view === 'date') {
        cell =
          this.wrapperEl.querySelector<HTMLElement>('.gear-datepicker-day-selected') ||
          this.wrapperEl.querySelector<HTMLElement>('td.gear-datepicker-today span:not(.gear-disabled)') ||
          this.wrapperEl.querySelector<HTMLElement>('.gear-datepicker-calendar td span:not(.gear-disabled)');
      } else {
        cell = this.wrapperEl.querySelector<HTMLElement>(view === 'month' ? '.gear-datepicker-month' : '.gear-datepicker-year');
      }
      if (cell) {
        const target = cell;
        target.tabIndex = 0;
        setTimeout(() => target.focus(), 1);
      }
    }
  }

  navBackward(event: Event): void {
    event.preventDefault();
    if (this.currentView === 'month') {
      this.currentYear--;
    } else if (this.currentView === 'year') {
      this.currentYear -= 10;
    } else {
      if (this.currentMonth === 0) {
        this.currentMonth = 11;
        this.currentYear--;
      } else {
        this.currentMonth--;
      }
      this.createMonth();
    }
  }

  navForward(event: Event): void {
    event.preventDefault();
    if (this.currentView === 'month') {
      this.currentYear++;
    } else if (this.currentView === 'year') {
      this.currentYear += 10;
    } else {
      if (this.currentMonth === 11) {
        this.currentMonth = 0;
        this.currentYear++;
      } else {
        this.currentMonth++;
      }
      this.createMonth();
    }
  }

  onTodayButtonClick(): void {
    const today = new Date();
    this.currentMonth = today.getMonth();
    this.currentYear = today.getFullYear();
    this.createMonth();
    this.onDateSelect({ day: today.getDate(), month: today.getMonth(), year: today.getFullYear(), today: true, selectable: true });
  }

  onClearButtonClick(): void {
    this.updateModel(null);
    this.updateInputfield();
    this.hideOverlay();
  }

  onInputFocus(): void {
    this.focused = true;
    if (this.preventFocusOpen) {
      this.preventFocusOpen = false;
      return;
    }
    this.showOverlay();
  }

  onInputClick(): void {
    if (!this.open) this.showOverlay();
  }

  onIconClick(): void {
    if (this.disabled) return;
    if (!this.open) {
      this.inputfield?.nativeElement.focus();
      this.showOverlay();
    }
  }

  onInputBlur(): void {
    this.focused = false;
    this.updateInputfield();
    this.onModelTouched();
  }

  onInputKeyDown(event: KeyboardEvent): void {
    this.isKeydown = true;
    if (event.key === 'Escape' && this.open) {
      this.hideOverlay();
      event.preventDefault();
    } else if (event.key === 'Tab' && this.open) {
      this.hideOverlay(false);
    } else if (event.key === 'ArrowDown' && !this.open) {
      this.showOverlay();
      event.preventDefault();
    }
  }

  onUserInput(event: Event): void {
    if (!this.isKeydown) return;
    this.isKeydown = false;
    const text = (event.target as HTMLInputElement).value;
    if (!text || text.trim().length === 0) {
      this.updateModel(null);
      return;
    }
    try {
      const value = this.parseDate(text);
      this.updateModel(value);
      this.updateUI();
    } catch {
      this.updateModel(null);
    }
  }

  showOverlay(): void {
    if (this.disabled || this.open) return;
    this.updateUI();
    this.currentView = 'date';
    this.open = true;
  }

  hideOverlay(refocus = true): void {
    if (!this.open) return;
    if (refocus) {
      this.preventFocusOpen = true;
      this.inputfield?.nativeElement.focus();
    }
    this.overlay.closed();
    this.open = false;
    this.wrapperEl = null;
  }

  ngOnDestroy(): void {
    this.hideOverlay(false);
  }
}
