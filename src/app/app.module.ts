import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { SidebarModule } from 'ng-sidebar';  // Sidebar Module
import { PdfViewerModule } from 'ng2-pdf-viewer';  // PDF Viewer

// Components
import { TopNavbarComponent } from './components/top-navbar/top-navbar.component';
import { AboutComponent } from './about/about.component';
import { AssistTechComponent } from './assist-tech/assist-tech.component';
import { HomeComponent } from './home/home.component';
import { SidenavComponent } from './components/sidenav/sidenav.component';

// Services
import { SharedService } from './services/shared.service';
import { FrameworkComponent } from './strategy/framework/framework.component';
import { InvestmentsComponent } from './strategy/investments/investments.component';

@NgModule({
  declarations: [
    AppComponent,
    TopNavbarComponent,
    AboutComponent,
    AssistTechComponent,
    HomeComponent,
    SidenavComponent,
    FrameworkComponent,
    InvestmentsComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    SidebarModule.forRoot(),
    PdfViewerModule,
    FontAwesomeModule,
  ],
  providers: [
    SharedService
  ],
  bootstrap: [AppComponent]
})

export class AppModule {

  constructor() { }

}
