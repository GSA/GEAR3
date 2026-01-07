import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { PdfViewerModule } from 'ng2-pdf-viewer'; // PDF Viewer
import { NgxChartsModule } from '@swimlane/ngx-charts'; // Visualizations

import { DrawerModule } from 'primeng/drawer';

// Components
import { TopNavbarComponent } from './components/top-navbar/top-navbar.component';

//// Main
import { HomeComponent } from './views/main/home/home.component';
import { GlobalSearchComponent } from './views/main/global-search/global-search.component';
import { AboutComponent } from './views/main/about/about.component';
import { AssistTechComponent } from './views/main/assist-tech/assist-tech.component';
import { FormsComponent } from './views/main/forms-glossary/forms/forms.component';
import { GlossaryComponent } from './views/main/forms-glossary/glossary/glossary.component';
import { GearManagerComponent } from './views/main/gear-manager/gear-manager.component';
import { GearManagerFailedLoginComponent } from './views/main/gear-manager-failed-login/gear-manager-failed-login.component';

//// Strategy
import { FrameworkComponent } from './views/strategy/framework/framework.component';
import { InvestmentsComponent } from './views/strategy/investments/investments.component';
import { InvestmentsModalComponent } from './components/modals/investments-modal/investments-modal.component';

//// Enterprise
import { CapabilitiesModelComponent } from './views/enterprise/capabilities-model/capabilities-model.component';
import { CapabilitiesComponent } from './views/enterprise/capabilities/capabilities.component';
import { CapabilitiesModalComponent } from './components/modals/capabilities-modal/capabilities-modal.component';
import { CapabilityManagerComponent } from './views/enterprise/capabilities/manager/capability-manager.component';

import { OrganizationsChartComponent } from './views/enterprise/organizations-chart/organizations-chart.component';
import { OrganizationsComponent } from './views/enterprise/organizations/organizations.component';
import { OrganizationsModalComponent } from './components/modals/organizations-modal/organizations-modal.component';

import { WebsiteServiceCategoryComponent } from './views/enterprise/website-service-category/website-service-category.component';
import { WebsiteServiceCategoryModalComponent } from './components/modals/website-service-category-modal/website-service-category-modal.component';

//// Systems
import { SystemsComponent } from './views/systems/systems/systems.component';
import { SystemsModalComponent } from './components/modals/systems-modal/systems-modal.component';
import { TimeComponent } from './views/systems/time/time.component';
import { RecordsManagementComponent } from './views/systems/records-management/records-management.component';
import { RecordsModalComponent } from './components/modals/records-modal/records-modal.component';
import { WebsitesComponent } from './views/systems/websites/websites.component';
import { WebsitesModalComponent } from './components/modals/websites-modal/websites-modal.component';

//// Security
import { FismaComponent } from './views/security/fisma/fisma.component';
import { FismaModalComponent } from './components/modals/fisma-modal/fisma-modal.component';
import { TableColumnFilterModalComponent } from './components/modals/table-column-filter-modal/table-column-filter-modal.component';
import { FismaPocsComponent } from './views/security/fisma-pocs/fisma-pocs.component';
import { FismaPocsDetailsComponent } from './views/security/fisma-pocs/details/fisma-pocs-details.component';

//// Technologies
import { ItStandardsComponent } from './views/technologies/it-standards/it-standards.component';
import { ItStandardsModalComponent } from './components/modals/it-standards-modal/it-standards-modal.component';
import { ItStandardsManagerComponent } from './views/technologies/manager/it-standards-manager.component';
import { ItStandardsDetailsComponent } from './views/technologies/details/it-standards-details.component';

//// Enterprise Architecture
//import { ArtifactsComponent } from './views/architecture/artifacts/artifacts.component';
import { EAViewComponent } from './views/architecture/ea-view/ea-view.component';
import { GearModelComponent } from './views/architecture/gear-model/gear-model.component';

import { DataDictionaryComponent } from './views/main/data-dictionary/data-dictionary.component';

// Global Variables
import { Globals } from './common/globals';

import { YesNoPipe } from "./pipes/yesno.pipe";
import { SkipFocusPiechartDirective } from '@common/skip-focus-piechart.directive';
import { BannerComponent } from './components/banner/banner.component';
import { IdentifierComponent } from './components/identifier/identifier.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { AccordionModule } from 'primeng/accordion';

// PrimeNG Modules
import { TableModule } from 'primeng/table';
import { MultiSelectModule } from 'primeng/multiselect';
import { ButtonModule } from 'primeng/button';
import { TableComponent } from './components/table/table.component';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { FilterButtonsComponent } from './components/filter-buttons/filter-buttons.component';
import { TooltipModule } from 'primeng/tooltip';
import { ButtonOverlayPanelComponent } from './components/button-overlay-panel/button-overlay-panel.component';
import { SidebarV2Component } from './components/sidebar-v2/sidebar-v2.component';
import { TopbarComponent } from './components/topbar/topbar.component';
import { SidebarButtonComponent } from './components/sidebar-button/sidebar-button.component';
import { ButtonComponent } from './components/button/button.component';
import { DashboardComponent } from './views/dashboard/dashboard.component';
import { FilterChipsComponent } from './components/filter-chips/filter-chips.component';
import { BreadcrumbComponent } from './components/breadcrumb/breadcrumb.component';
import { InvestmentsDetailsComponent } from './views/strategy/investments/details/investments-details.component';
import { CapabilitiesDetailsComponent } from './views/enterprise/capabilities/details/capabilities-details.component';
import { OrganizationsDetailsComponent } from './views/enterprise/organizations/details/organizations-details.component';
import { WebsiteServiceCategoryDetailsComponent } from './views/enterprise/website-service-category/details/website-service-category-details.component';
import { SystemsDetailsComponent } from './views/systems/systems/details/systems-details.component';
import { TimeDetailsComponent } from './views/systems/time/details/time-details.component';
import { RecordsManagementDetailsComponent } from './views/systems/records-management/details/records-management-details.component';
import { WebsitesDetailsComponent } from './views/systems/websites/details/websites-details.component';
import { WebsiteServiceCategoryDetailsContentComponent } from './views/enterprise/website-service-category/website-service-category-details-content/website-service-category-details-content.component';
import { providePrimeNG } from 'primeng/config';
import { DatePickerModule } from 'primeng/datepicker';
import { PopoverModule } from 'primeng/popover';

import Lara from '@primeuix/themes/lara';
import { CommonModule } from '@angular/common';
import { FismaDetailsComponent } from './views/security/fisma/details/fisma-details.component';
import { FeedbackComponent } from './views/main/feedback/feedback.component';
import { SystemsManagerComponent } from './views/systems/systems/manager/systems-manager.component';
import { RecordsManagementManagerComponent } from './views/systems/records-management/manager/records-management-manager.component';
import { WebsitesManagerComponent } from './views/systems/websites/manager/websites-manager.component';

@NgModule({ declarations: [
        AppComponent,
        TopNavbarComponent,
        HomeComponent,
        GlobalSearchComponent,
        AboutComponent,
        AssistTechComponent,
        FormsComponent,
        GlossaryComponent,
        GearManagerComponent,
        GearManagerFailedLoginComponent,
        FrameworkComponent,
        InvestmentsComponent,
        InvestmentsModalComponent,
        InvestmentsDetailsComponent,
        CapabilitiesModelComponent,
        CapabilitiesComponent,
        CapabilitiesDetailsComponent,
        CapabilitiesModalComponent,
        CapabilityManagerComponent,
        OrganizationsChartComponent,
        OrganizationsComponent,
        OrganizationsDetailsComponent,
        OrganizationsModalComponent,
        WebsiteServiceCategoryComponent,
        WebsiteServiceCategoryDetailsComponent,
        WebsiteServiceCategoryDetailsContentComponent,
        WebsiteServiceCategoryModalComponent,
        SystemsComponent,
        SystemsDetailsComponent,
        SystemsModalComponent,
        SystemsManagerComponent,
        TimeComponent,
        TimeDetailsComponent,
        RecordsManagementComponent,
        RecordsManagementDetailsComponent,
        RecordsModalComponent,
        RecordsManagementManagerComponent,
        WebsitesComponent,
        WebsitesDetailsComponent,
        WebsitesModalComponent,
        WebsitesManagerComponent,
        FismaComponent,
        FismaDetailsComponent,
        FismaModalComponent,
        TableColumnFilterModalComponent,
        FismaPocsComponent,
        FismaPocsDetailsComponent,
        ItStandardsComponent,
        ItStandardsModalComponent,
        ItStandardsDetailsComponent,
        ItStandardsManagerComponent,
        //ArtifactsComponent,
        EAViewComponent,
        GearModelComponent,
        YesNoPipe,
        SkipFocusPiechartDirective,
        BannerComponent,
        IdentifierComponent,
        SidebarComponent,
        SidebarV2Component,
        TopbarComponent,
        DataDictionaryComponent,
        TableComponent,
        FilterButtonsComponent,
        ButtonOverlayPanelComponent,
        SidebarButtonComponent,
        ButtonComponent,
        DashboardComponent,
        FilterChipsComponent,
        BreadcrumbComponent,
        FeedbackComponent
    ],
    bootstrap: [
      AppComponent
    ],
    imports: [
        AppRoutingModule,
        BrowserModule,
        BrowserAnimationsModule,
        CommonModule,
        FormsModule,
        NgSelectModule,
        NgxChartsModule,
        PdfViewerModule,
        ReactiveFormsModule,
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
        PopoverModule
    ],
    providers: [
      Globals, provideHttpClient(withInterceptorsFromDi()),
      providePrimeNG({
        theme: {
          preset: Lara,
          options: {
            prefix: 'p',
            darkModeSelector: 'system',
            cssLayer: {
              name: 'primeng',
              order: 'tailwind-base, primeng, tailwind-utilities'
            }
          }
        },
        ripple: true,
        inputStyle: 'outlined'
      })
    ] })
export class AppModule {
  constructor() {}
}