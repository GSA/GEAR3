import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { SidebarModule } from 'ng-sidebar';  // Sidebar Module
import { PdfViewerModule } from 'ng2-pdf-viewer';  // PDF Viewer

// Components
import { TopNavbarComponent } from './components/top-navbar/top-navbar.component';
import { AboutComponent } from './main/about/about.component';

//// Main
import { AssistTechComponent } from './main/assist-tech/assist-tech.component';
import { HomeComponent } from './main/home/home.component';
import { SidenavComponent } from './components/sidenav/sidenav.component';

//// Strategy
import { FrameworkComponent } from './strategy/framework/framework.component';
import { InvestmentsComponent } from './strategy/investments/investments.component';
import { InvestmentsModalComponent } from './components/modals/investments-modal/investments-modal.component';

//// Business
import { CapabilitiesModelComponent } from './business/capabilities-model/capabilities-model.component';
import { CapabilitiesComponent } from './business/capabilities/capabilities.component';
import { CapabilitiesModalComponent } from './components/modals/capabilities-modal/capabilities-modal.component';

import { OrganizationsComponent } from './business/organizations/organizations.component';
import { OrganizationsModalComponent } from './components/modals/organizations-modal/organizations-modal.component';

// Services
import { ModalsService } from './services/modals/modals.service';
import { SharedService } from './services/shared/shared.service';

@NgModule({
  declarations: [
    AppComponent,

    TopNavbarComponent,
    SidenavComponent,
    
    AboutComponent,
    AssistTechComponent,
    HomeComponent,

    FrameworkComponent,
    InvestmentsComponent,
    InvestmentsModalComponent,

    CapabilitiesModelComponent,
    CapabilitiesComponent,
    CapabilitiesModalComponent,
    OrganizationsComponent,
    OrganizationsModalComponent
  ],
  imports: [
    AppRoutingModule,
    BrowserModule,
    HttpClientModule,
    PdfViewerModule,
    SidebarModule.forRoot()
  ],
  providers: [
    ModalsService,
    SharedService
  ],
  bootstrap: [AppComponent]
})

export class AppModule {

  constructor() { }

}
