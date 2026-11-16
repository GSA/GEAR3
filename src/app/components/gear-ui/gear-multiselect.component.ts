import {
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnDestroy,
  Output,
  TemplateRef,
  ViewChild,
  forwardRef,
  inject,
} from '@angular/core';
import { NgClass, NgTemplateOutlet } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { GearIconComponent } from './gear-icon.component';
import { GearRippleDirective } from './gear-ripple.directive';
import { GearConnectedOverlay } from './gear-overlay';
import { FILTER_FUNCTIONS, deepEquals, resolveFieldData } from './gear-filter';
import { uniqueId } from './gear-dom';

// Multi-select dropdown with checkboxes, an optional filter box and chip display. Used for the
// report table's Add/Remove Columns picker and the IT Standards Manager operating-system field.
// Markup, classes, keyboard handling and overlay placement match the PrimeNG <p-multiSelect>.
@Component({
  selector: 'gear-multiselect',
  standalone: true,
  imports: [NgClass, NgTemplateOutlet, GearIconComponent, GearRippleDirective],
  changeDetection: ChangeDetectionStrategy.Eager,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => GearMultiSelectComponent), multi: true }],
  host: {
    '[class]': 'hostClasses',
    '[style.position]': '"relative"',
    '[attr.id]': 'inputId || null',
    '(click)': 'onContainerClick($event)',
  },
  template: `
    <div class="gear-hidden-accessible">
      <input
        #focusInput
        role="combobox"
        [attr.aria-label]="ariaLabel"
        aria-haspopup="listbox"
        [attr.aria-expanded]="open"
        [attr.aria-controls]="open ? id + '_list' : null"
        [attr.aria-disabled]="disabled"
        [attr.aria-activedescendant]="focused && focusedIndex !== -1 ? id + '_' + focusedIndex : null"
        [attr.tabindex]="disabled ? -1 : 0"
        [disabled]="disabled"
        readonly
        (focus)="focused = true"
        (blur)="onTouched(); focused = false"
        (keydown)="onKeyDown($event)"
      />
    </div>
    <div class="gear-multiselect-label-container">
      <div
        class="gear-multiselect-label"
        [ngClass]="{ 'gear-placeholder': showPlaceholder, 'gear-multiselect-label-empty': !placeholder && !value.length }"
      >
        @if (selectedItemsTemplate) {
          <ng-container *ngTemplateOutlet="selectedItemsTemplate; context: { $implicit: value }"></ng-container>
        } @else if (display === 'chip' && value.length) {
          @for (item of value; track $index) {
            <div class="gear-multiselect-chip-item">
              <div class="gear-chip gear-component gear-multiselect-chip">
                <div class="gear-chip-label">{{ labelForValue(item) }}</div>
                @if (!disabled) {
                  <svg
                    gearIcon="times-circle"
                    class="gear-chip-remove-icon gear-multiselect-chip-icon"
                    role="button"
                    tabindex="0"
                    aria-label="Remove"
                    (click)="removeOption(item, $event)"
                    (keydown.enter)="removeOption(item, $event)"
                    (keydown.backspace)="removeOption(item, $event)"
                  ></svg>
                }
              </div>
            </div>
          }
        } @else {
          {{ labelText }}
        }
      </div>
    </div>
    <div class="gear-multiselect-dropdown">
      <svg gearIcon="chevron-down" class="gear-multiselect-dropdown-icon gear-icon"></svg>
    </div>
    @if (open) {
      <div #wrapper class="gear-overlay gear-component" style="position: absolute; top: 0" (click)="overlay.markOverlayClick()">
        <div class="gear-multiselect-overlay gear-component-overlay gear-component" [attr.id]="id + '_list_overlay'" (click)="$event.stopPropagation(); overlay.markOverlayClick()">
          @if (showHeader) {
            <div class="gear-multiselect-header">
              @if (filter) {
                <div class="gear-multiselect-filter-container gear-iconfield gear-iconfield-left">
                  <input
                    #filterInput
                    type="text"
                    role="searchbox"
                    autocomplete="off"
                    class="gear-multiselect-filter gear-component gear-inputtext"
                    [attr.aria-owns]="id + '_list'"
                    [attr.aria-activedescendant]="focusedIndex !== -1 ? id + '_' + focusedIndex : null"
                    [value]="filterValue"
                    (input)="onFilterInput($event)"
                    (keydown)="onFilterKeyDown($event)"
                  />
                  <span class="gear-inputicon"><svg gearIcon="search" class="gear-icon"></svg></span>
                </div>
              }
            </div>
          }
          <div class="gear-multiselect-list-container" [style.max-height]="scrollHeight">
            <ul class="gear-multiselect-list" role="listbox" aria-multiselectable="true" [attr.id]="id + '_list'" aria-label="Option List">
              @for (option of visibleOptions; track option; let i = $index) {
                <li
                  gearRipple
                  role="option"
                  class="gear-multiselect-option"
                  [ngClass]="{ 'gear-multiselect-option-selected': isSelected(option), 'gear-focus': focusedIndex === i }"
                  [attr.id]="id + '_' + i"
                  [attr.aria-label]="labelForOption(option)"
                  [attr.aria-setsize]="visibleOptions.length"
                  [attr.aria-posinset]="i + 1"
                  [attr.aria-selected]="isSelected(option)"
                  [attr.aria-checked]="isSelected(option)"
                  (click)="onOptionClick(option, i)"
                  (mousemove)="focusedIndex = i"
                >
                  <div class="gear-checkbox gear-component" [ngClass]="{ 'gear-checkbox-checked': isSelected(option) }">
                    <input type="checkbox" class="gear-checkbox-input" tabindex="-1" [attr.aria-label]="labelForOption(option)" [checked]="isSelected(option)" />
                    <div class="gear-checkbox-box">
                      @if (isSelected(option)) {
                        <svg gearIcon="check" class="gear-checkbox-icon gear-icon"></svg>
                      }
                    </div>
                  </div>
                  <span>{{ labelForOption(option) }}</span>
                </li>
              }
              @if (filterValue && !visibleOptions.length) {
                <li class="gear-multiselect-empty-message" role="option">No results found</li>
              }
            </ul>
          </div>
        </div>
      </div>
    }
  `,
})
export class GearMultiSelectComponent implements ControlValueAccessor, OnDestroy {
  @Input() options: any[] = [];
  @Input() optionLabel = '';
  @Input() optionValue = '';
  @Input() placeholder = '';
  @Input() display: 'comma' | 'chip' = 'comma';
  @Input() filter = true;
  @Input() showHeader = true;
  @Input() scrollHeight = '200px';
  @Input() ariaLabel: string | null = null;
  @Input() inputId = '';
  @Input() styleClass = '';
  @Input() disabled = false;

  @Output() onChange = new EventEmitter<{ originalEvent: Event | null; value: any[]; itemValue: any }>();

  @ContentChild('selectedItems') selectedItemsTemplate?: TemplateRef<any>;

  @ViewChild('focusInput') focusInput?: ElementRef<HTMLInputElement>;
  @ViewChild('filterInput') filterInput?: ElementRef<HTMLInputElement>;
  @ViewChild('wrapper') set wrapperRef(ref: ElementRef<HTMLElement> | undefined) {
    this.wrapperEl = ref?.nativeElement ?? null;
    if (this.wrapperEl) {
      this.overlay.opened();
      const selected = this.wrapperEl.querySelector('.gear-multiselect-option-selected');
      selected?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }

  readonly id = uniqueId();
  value: any[] = [];
  open = false;
  focused = false;
  focusedIndex = -1;
  filterValue = '';

  private el = inject<ElementRef<HTMLElement>>(ElementRef);
  private zone = inject(NgZone);
  private wrapperEl: HTMLElement | null = null;
  private onModelChange: (v: any[]) => void = () => {};
  onTouched: () => void = () => {};

  overlay = new GearConnectedOverlay(
    this.zone,
    () => this.el.nativeElement,
    () => this.wrapperEl,
    () => this.hide(),
  );

  get hostClasses(): string {
    return [
      'gear-multiselect gear-component gear-inputwrapper',
      this.display === 'chip' ? 'gear-multiselect-display-chip' : '',
      this.disabled ? 'gear-disabled' : '',
      this.focused ? 'gear-focus' : '',
      this.value.length ? 'gear-inputwrapper-filled' : '',
      this.focused || this.open ? 'gear-inputwrapper-focus' : '',
      this.open ? 'gear-multiselect-open' : '',
      this.styleClass,
    ]
      .filter(Boolean)
      .join(' ');
  }

  get visibleOptions(): any[] {
    if (!this.filterValue) {
      return this.options || [];
    }
    return (this.options || []).filter((o) => FILTER_FUNCTIONS['contains'](this.labelForOption(o), this.filterValue));
  }

  get showPlaceholder(): boolean {
    return !this.value.length && !!this.placeholder;
  }

  get labelText(): string {
    if (!this.value.length) {
      return this.placeholder || '\u00a0';
    }
    return this.value.map((v) => this.labelForValue(v)).join(', ');
  }

  labelForOption(option: any): string {
    return this.optionLabel ? resolveFieldData(option, this.optionLabel) : option?.label ?? option;
  }

  private valueForOption(option: any): any {
    return this.optionValue ? resolveFieldData(option, this.optionValue) : option;
  }

  labelForValue(value: any): string {
    const option = (this.options || []).find((o) => deepEquals(this.valueForOption(o), value));
    return option ? this.labelForOption(option) : value;
  }

  isSelected(option: any): boolean {
    const v = this.valueForOption(option);
    return this.value.some((val) => deepEquals(val, v));
  }

  writeValue(v: any[] | null): void {
    this.value = v ? [...v] : [];
  }

  registerOnChange(fn: (v: any[]) => void): void {
    this.onModelChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onContainerClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (this.disabled || target.closest('.gear-chip-remove-icon') || (this.wrapperEl && this.wrapperEl.contains(target))) {
      return;
    }
    this.focusInput?.nativeElement.focus({ preventScroll: true });
    this.open ? this.hide() : this.show();
  }

  show(): void {
    if (this.open) return;
    this.focusedIndex = this.visibleOptions.findIndex((o) => this.isSelected(o));
    this.open = true;
  }

  hide(): void {
    if (!this.open) return;
    this.overlay.closed();
    this.open = false;
    this.wrapperEl = null;
    this.focusedIndex = -1;
    this.onTouched();
  }

  // Mouse selection leaves focus where PrimeNG left it (the trigger loses its focus ring while
  // the list stays open); keyboard selection keeps focus on the trigger.
  onOptionClick(option: any, index: number): void {
    this.toggleOption(option, null);
    this.focusedIndex = index;
  }

  private toggleOption(option: any, event: Event | null): void {
    const optionValue = this.valueForOption(option);
    const value = this.isSelected(option)
      ? this.value.filter((v) => !deepEquals(v, optionValue))
      : [...this.value, optionValue];
    this.updateModel(value, event, option);
  }

  removeOption(item: any, event: Event): void {
    event.stopPropagation();
    const value = this.value.filter((v) => !deepEquals(v, item));
    this.updateModel(value, event, item);
  }

  private updateModel(value: any[], event: Event | null, itemValue: any): void {
    this.value = value;
    this.onModelChange(value);
    this.onChange.emit({ originalEvent: event, value, itemValue });
  }

  onFilterInput(event: Event): void {
    this.filterValue = (event.target as HTMLInputElement).value;
    this.focusedIndex = -1;
  }

  onFilterKeyDown(event: KeyboardEvent): void {
    switch (event.code) {
      case 'ArrowDown':
      case 'ArrowUp':
      case 'Enter':
      case 'NumpadEnter':
      case 'Escape':
      case 'Tab':
        this.onKeyDown(event, true);
        break;
    }
  }

  onKeyDown(event: KeyboardEvent, fromFilter = false): void {
    if (this.disabled) return;
    const options = this.visibleOptions;
    switch (event.code) {
      case 'ArrowDown':
        this.focusedIndex = this.focusedIndex === -1 ? 0 : Math.min(options.length - 1, this.focusedIndex + 1);
        if (!this.open) this.show();
        event.preventDefault();
        event.stopPropagation();
        break;
      case 'ArrowUp':
        if (event.altKey && !fromFilter) {
          if (this.focusedIndex !== -1) this.toggleOption(options[this.focusedIndex], event);
          this.hide();
        } else {
          this.focusedIndex = this.focusedIndex === -1 ? options.length - 1 : Math.max(0, this.focusedIndex - 1);
          if (!this.open) this.show();
        }
        event.preventDefault();
        event.stopPropagation();
        break;
      case 'Home':
        if (!fromFilter) {
          this.focusedIndex = 0;
          if (!this.open) this.show();
          event.preventDefault();
        }
        break;
      case 'End':
        if (!fromFilter) {
          this.focusedIndex = options.length - 1;
          if (!this.open) this.show();
          event.preventDefault();
        }
        break;
      case 'Enter':
      case 'NumpadEnter':
      case 'Space':
        if (fromFilter && event.code === 'Space') return;
        if (!this.open) {
          this.focusedIndex = this.focusedIndex === -1 ? 0 : this.focusedIndex;
          this.show();
        } else if (this.focusedIndex !== -1) {
          this.toggleOption(options[this.focusedIndex], event);
        }
        event.preventDefault();
        break;
      case 'Escape':
        if (this.open) {
          this.hide();
          this.focusInput?.nativeElement.focus({ preventScroll: true });
          event.stopPropagation();
          event.preventDefault();
        }
        break;
      case 'Tab':
        if (this.open) {
          this.hide();
        }
        break;
    }
  }

  ngOnDestroy(): void {
    this.hide();
  }
}
