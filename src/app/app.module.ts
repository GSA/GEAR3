import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { PdfViewerModule } from 'ng2-pdf-viewer'; // PDF Viewer
import { NgxChartsModule } from '@swimlane/ngx-charts'; // Visualizations
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { SidebarModule } from 'primeng/sidebar';

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

//// Strategy
import { FrameworkComponent } from './views/strategy/framework/framework.component';
import { InvestmentsComponent } from './views/strategy/investments/investments.component';
import { InvestmentsModalComponent } from './components/modals/investments-modal/investments-modal.component';

//// Enterprise
import { CapabilitiesModelComponent } from './views/enterprise/capabilities-model/capabilities-model.component';
import { CapabilitiesComponent } from './views/enterprise/capabilities/capabilities.component';
import { CapabilitiesModalComponent } from './components/modals/capabilities-modal/capabilities-modal.component';
import { CapabilityManagerComponent } from './components/manager-modals/capability-manager/capability-manager.component';

import { OrganizationsChartComponent } from './views/enterprise/organizations-chart/organizations-chart.component';
import { OrganizationsComponent } from './views/enterprise/organizations/organizations.component';
import { OrganizationsModalComponent } from './components/modals/organizations-modal/organizations-modal.component';

import { WebsiteServiceCategoryComponent } from './views/enterprise/website-service-category/website-service-category.component';
import { WebsiteServiceCategoryModalComponent } from './components/modals/website-service-category-modal/website-service-category-modal.component';

//// Systems
import { SystemsComponent } from './views/systems/systems/systems.component';
import { SystemsModalComponent } from './components/modals/systems-modal/systems-modal.component';
import { SystemManagerComponent } from './components/manager-modals/system-manager/system-manager.component';
import { TimeComponent } from './views/systems/time/time.component';
import { RecordsManagementComponent } from './views/systems/records-management/records-management.component';
import { RecordsModalComponent } from './components/modals/records-modal/records-modal.component';
import { RecordManagerComponent } from './components/manager-modals/record-manager/record-manager.component';
import { WebsitesComponent } from './views/systems/websites/websites.component';
import { WebsitesModalComponent } from './components/modals/websites-modal/websites-modal.component';
import { WebsiteManagerComponent } from './components/manager-modals/website-manager/website-manager.component';

//// Security
import { FismaComponent } from './views/security/fisma/fisma.component';
import { FismaModalComponent } from './components/modals/fisma-modal/fisma-modal.component';
import { FismaPocsComponent } from './views/security/fisma-pocs/fisma-pocs.component';

//// Technologies
import { ItStandardsComponent } from './views/technologies/it-standards/it-standards.component';
import { ItStandardsModalComponent } from './components/modals/it-standards-modal/it-standards-modal.component';
import { ItStandardManagerComponent } from './components/manager-modals/it-standard-manager/it-standard-manager.component';

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
        FrameworkComponent,
        InvestmentsComponent,
        InvestmentsModalComponent,
        CapabilitiesModelComponent,
        CapabilitiesComponent,
        CapabilitiesModalComponent,
        CapabilityManagerComponent,
        OrganizationsChartComponent,
        OrganizationsComponent,
        OrganizationsModalComponent,
        WebsiteServiceCategoryComponent,
        WebsiteServiceCategoryModalComponent,
        SystemsComponent,
        SystemsModalComponent,
        SystemManagerComponent,
        TimeComponent,
        RecordsManagementComponent,
        RecordsModalComponent,
        RecordManagerComponent,
        WebsitesComponent,
        WebsitesModalComponent,
        WebsiteManagerComponent,
        FismaComponent,
        FismaModalComponent,
        FismaPocsComponent,
        ItStandardsComponent,
        ItStandardsModalComponent,
        ItStandardManagerComponent,
        //ArtifactsComponent,
        EAViewComponent,
        GearModelComponent,
        YesNoPipe,
        SkipFocusPiechartDirective,
        BannerComponent,
        IdentifierComponent,
        SidebarComponent,
        DataDictionaryComponent,
        TableComponent,
        FilterButtonsComponent
    ],
    bootstrap: [AppComponent], imports: [AppRoutingModule,
        BrowserAnimationsModule,
        BrowserModule,
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
        SidebarModule,
        AccordionModule
    ],
    providers: [Globals, provideHttpClient(withInterceptorsFromDi())] })
export class AppModule {
  constructor() {}
}
