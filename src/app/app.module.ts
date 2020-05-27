import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { SidebarModule } from 'ng-sidebar';  // Sidebar Module
import { PdfViewerModule } from 'ng2-pdf-viewer';  // PDF Viewer

// Components
import { TopNavbarComponent } from './components/top-navbar/top-navbar.component';
import { AboutComponent } from './about/about.component';

//// Main
import { AssistTechComponent } from './assist-tech/assist-tech.component';
import { HomeComponent } from './home/home.component';
import { SidenavComponent } from './components/sidenav/sidenav.component';

//// Strategy
import { FrameworkComponent } from './strategy/framework/framework.component';
import { InvestmentsComponent } from './strategy/investments/investments.component';
import { InvestmentsModalComponent } from './components/modals/investments-modal/investments-modal.component';

// Services
import { SharedService } from './services/shared/shared.service';
import { ModalsService } from './services/modals/modals.service';

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
    InvestmentsModalComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    SidebarModule.forRoot(),
    PdfViewerModule
  ],
  providers: [
    SharedService,
    ModalsService
  ],
  bootstrap: [AppComponent]
})

export class AppModule {

  constructor() { }

}