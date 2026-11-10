import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';

// PrimeNG
import { TableModule } from 'primeng/table';
import { MultiSelectModule } from 'primeng/multiselect';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { DrawerModule } from 'primeng/drawer';
import { AccordionModule } from 'primeng/accordion';
import { TooltipModule } from 'primeng/tooltip';
import { DatePickerModule } from 'primeng/datepicker';
import { PopoverModule } from 'primeng/popover';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';

// Shared components
import { TableComponent } from '../components/table/table.component';
import { FilterButtonsComponent } from '../components/filter-buttons/filter-buttons.component';
import { FilterChipsComponent } from '../components/filter-chips/filter-chips.component';
import { BreadcrumbComponent } from '../components/breadcrumb/breadcrumb.component';
import { ButtonComponent } from '../components/button/button.component';
import { ButtonOverlayPanelComponent } from '../components/button-overlay-panel/button-overlay-panel.component';
import { SidebarButtonComponent } from '../components/sidebar-button/sidebar-button.component';
import { PageHelpButtonComponent } from '../components/page-help-button/page-help-button.component';
import { YesNoPipe } from '../pipes/yesno.pipe';
import { SkipFocusPiechartDirective } from '../common/skip-focus-piechart.directive';
import { TableColumnFilterModalComponent } from '../components/modals/table-column-filter-modal/table-column-filter-modal.component';

const SHARED_DECLARATIONS = [
  TableComponent,
  FilterButtonsComponent,
  FilterChipsComponent,
  BreadcrumbComponent,
  ButtonComponent,
  ButtonOverlayPanelComponent,
  SidebarButtonComponent,
  PageHelpButtonComponent,
  YesNoPipe,
  SkipFocusPiechartDirective,
  TableColumnFilterModalComponent,
];

const SHARED_MODULES = [
  CommonModule,
  FormsModule,
  ReactiveFormsModule,
  RouterModule,
  NgSelectModule,
  TableModule,
  MultiSelectModule,
  ButtonModule,
  IconFieldModule,
  InputIconModule,
  InputTextModule,
  DrawerModule,
  AccordionModule,
  TooltipModule,
  DatePickerModule,
  PopoverModule,
  InputGroupModule,
  InputGroupAddonModule,
];

@NgModule({
  declarations: SHARED_DECLARATIONS,
  imports: SHARED_MODULES,
  exports: [
    ...SHARED_DECLARATIONS,
    ...SHARED_MODULES,
  ],
})
export class SharedModule {}
