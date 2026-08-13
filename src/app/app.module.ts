import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
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
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { SidebarV2Component } from './components/sidebar-v2/sidebar-v2.component';
import { TopbarComponent } from './components/topbar/topbar.component';

import { providePrimeNG } from 'primeng/config';
import Lara from '@primeuix/themes/lara';

// SharedModule provides all shared components, pipes, directives & PrimeNG modules
// to each feature module. Layout components above are kept here since they live
// outside the router-outlet (in AppComponent template).
import { SharedModule } from './shared/shared.module';

@NgModule({
  declarations: [
    AppComponent,
    TopNavbarComponent,
    BannerComponent,
    IdentifierComponent,
    SidebarComponent,
    SidebarV2Component,
    TopbarComponent,
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
    provideHttpClient(withInterceptorsFromDi()),
    PreviousRouteService,
    providePrimeNG({
      theme: {
        preset: Lara,
        options: {
          prefix: 'p',
          darkModeSelector: false,
          cssLayer: {
            name: 'primeng',
            order: 'tailwind-base, primeng, tailwind-utilities'
          }
        }
      },
      ripple: true,
      inputStyle: 'outlined'
    })
  ]
})
export class AppModule {
  constructor() {}
}