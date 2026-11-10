import { Injectable, NgModule } from '@angular/core';
import {
  Routes,
  RouterModule,
  TitleStrategy,
  RouterStateSnapshot,
  ExtraOptions,
} from '@angular/router';
import { Title } from '@angular/platform-browser';

const routes: Routes = [
  // Dashboard (root)
  {
    path: '',
    loadChildren: () =>
      import('./views/dashboard/dashboard.module').then(m => m.DashboardModule),
  },

  // Main / General pages
  {
    path: '',
    loadChildren: () =>
      import('./views/main/main.module').then(m => m.MainModule),
  },

  // Strategy
  {
    path: '',
    loadChildren: () =>
      import('./views/strategy/strategy.module').then(m => m.StrategyModule),
  },

  // Enterprise
  {
    path: '',
    loadChildren: () =>
      import('./views/enterprise/enterprise.module').then(m => m.EnterpriseModule),
  },

  // Systems
  {
    path: '',
    loadChildren: () =>
      import('./views/systems/systems.module').then(m => m.SystemsModule),
  },

  // Security
  {
    path: '',
    loadChildren: () =>
      import('./views/security/security.module').then(m => m.SecurityModule),
  },

  // Technologies
  {
    path: '',
    loadChildren: () =>
      import('./views/technologies/technologies.module').then(m => m.TechnologiesModule),
  },

  // Architecture
  {
    path: '',
    loadChildren: () =>
      import('./views/architecture/architecture.module').then(m => m.ArchitectureModule),
  },

  // Catch-all redirect to home
  { path: '**', redirectTo: '', pathMatch: 'full' },
];

@Injectable({ providedIn: 'root' })
export class TemplatePageTitleStrategy extends TitleStrategy {
  constructor(private readonly title: Title) {
    super();
  }

  override updateTitle(routerState: RouterStateSnapshot) {
    const title = this.buildTitle(routerState);
    if (title !== undefined) {
      this.title.setTitle(`GEAR | ${title}`);
    }
  }
}

const routerOption: ExtraOptions = {
  scrollPositionRestoration: 'enabled',
  anchorScrolling: 'enabled',
  useHash: true,
  onSameUrlNavigation: 'reload'
};

@NgModule({
  imports: [
    RouterModule.forRoot(routes, routerOption),
  ],
  exports: [RouterModule],
  providers: [{ provide: TitleStrategy, useClass: TemplatePageTitleStrategy }],
})
export class AppRoutingModule {}