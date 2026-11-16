import { GearAccordionComponent, GearAccordionPanelComponent } from './gear-accordion.component';
import { GearButtonComponent } from './gear-button.component';
import { GearDataTableComponent, GearSelectableRowDirective, GearSortIconComponent, GearSortableColumnDirective } from './gear-datatable.component';
import { GearDatePickerComponent } from './gear-datepicker.component';
import { GearIconComponent } from './gear-icon.component';
import { GearMultiSelectComponent } from './gear-multiselect.component';
import { GearPaginatorComponent, GearSelectComponent } from './gear-paginator.component';
import { GearPopoverComponent } from './gear-popover.component';
import { GearRippleDirective } from './gear-ripple.directive';
import { GearTooltipDirective } from './gear-tooltip.directive';

export const GEAR_UI = [
  GearAccordionComponent,
  GearAccordionPanelComponent,
  GearButtonComponent,
  GearDataTableComponent,
  GearSelectableRowDirective,
  GearSortIconComponent,
  GearSortableColumnDirective,
  GearDatePickerComponent,
  GearIconComponent,
  GearMultiSelectComponent,
  GearPaginatorComponent,
  GearSelectComponent,
  GearPopoverComponent,
  GearRippleDirective,
  GearTooltipDirective,
] as const;
