import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Global Variables
import { Globals } from './common/globals';
import { PreviousRouteService } from '@services/previous-route/previous-route.service';

// Layout components (always present, not lazy-loaded)
import { TopNavbarComponent } from './components/top-navbar/top-navbar.component';
import { BannerComponent } from './components/banner/banner.component';
import { IdentifierComponent } from './components/identifier/identifier.component';
import { SidebarV2Component } from './components/sidebar-v2/sidebar-v2.component';
import { TopbarComponent } from './components/topbar/topbar.component';
import { ChatbotComponent } from './components/chatbot/chatbot.component';

// SharedModule provides all shared components, pipes, directives & GEAR UI widgets
// to each feature module. Layout components above are kept here since they live
// outside the router-outlet (in AppComponent template).
import { SharedModule } from './shared/shared.module';

@NgModule({
  declarations: [
    AppComponent,
    TopNavbarComponent,
    BannerComponent,
    IdentifierComponent,
    SidebarV2Component,
    TopbarComponent,
    ChatbotComponent,
  ],
  bootstrap: [AppComponent],
  imports: [
    AppRoutingModule,
    BrowserModule,
    BrowserAnimationsModule,
    SharedModule,
  ],
  providers: [
    Globals,
    provideHttpClient(withXhr(), withInterceptorsFromDi()),
    PreviousRouteService
  ]
})
export class AppModule {
  constructor() {}
}