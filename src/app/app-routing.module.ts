import { Injectable, NgModule } from '@angular/core';
import {
  Routes,
  RouterModule,
  TitleStrategy,
  RouterStateSnapshot,
} from '@angular/router';

// Main
import { HomeComponent } from './views/main/home/home.component';
import { GlobalSearchComponent } from './views/main/global-search/global-search.component';
import { AboutComponent } from './views/main/about/about.component';
import { AssistTechComponent } from './views/main/assist-tech/assist-tech.component';
import { FormsGlossaryComponent } from './views/main/forms-glossary/forms-glossary.component';
import { GearManagerComponent } from './views/main/gear-manager/gear-manager.component';

// Strategy
import { FrameworkComponent } from './views/strategy/framework/framework.component';
import { InvestmentsComponent } from './views/strategy/investments/investments.component';

// Enterprise
import { CapabilitiesModelComponent } from './views/enterprise/capabilities-model/capabilities-model.component';
import { CapabilitiesComponent } from './views/enterprise/capabilities/capabilities.component';
import { OrganizationsChartComponent } from './views/enterprise/organizations-chart/organizations-chart.component';
import { OrganizationsComponent } from './views/enterprise/organizations/organizations.component';
import { WebsiteServiceCategoryComponent } from './views/enterprise/website-service-category/website-service-category.component';
// Systems
import { SystemsComponent } from './views/systems/systems/systems.component';
import { TimeComponent } from './views/systems/time/time.component';
import { RecordsManagementComponent } from './views/systems/records-management/records-management.component';
import { WebsitesComponent } from './views/systems/websites/websites.component';

// Security
import { FismaComponent } from './views/security/fisma/fisma.component';
import { FismaPocsComponent } from './views/security/fisma-pocs/fisma-pocs.component';

// Technologies
import { ItStandardsComponent } from './views/technologies/it-standards/it-standards.component';

// Enterprise Architecture
import { ArtifactsComponent } from './views/architecture/artifacts/artifacts.component';
import { GearModelComponent } from './views/architecture/gear-model/gear-model.component';
import { Title } from '@angular/platform-browser';

const routes: Routes = [
  { path: '', component: HomeComponent, title: 'Home' },
  { path: 'search', component: GlobalSearchComponent, title: 'Search' },
  { path: 'about', component: AboutComponent, title: 'About' },
  { path: 'about/:tab', component: AboutComponent, title: 'About' },
  {
    path: 'assist_tech',
    component: AssistTechComponent,
    title: 'Assistive Technology',
  },

  {
    path: 'strategic_framework',
    component: FrameworkComponent,
    title: 'Strategic Framework',
  },
  {
    path: 'investments',
    component: InvestmentsComponent,
    title: 'Investments',
  },
  {
    path: 'investments/:investID',
    component: InvestmentsComponent,
    title: 'Investment',
  },

  {
    path: 'capabilities_model',
    component: CapabilitiesModelComponent,
    title: 'Capabilities Model',
  },
  {
    path: 'capabilities_model/:capID',
    component: CapabilitiesModelComponent,
    title: 'Capability Model',
  },
  {
    path: 'capabilities',
    component: CapabilitiesComponent,
    title: 'Capabilities',
  },
  {
    path: 'capabilities/:capID',
    component: CapabilitiesComponent,
    title: 'Capabilities',
  },
  {
    path: 'org_chart',
    component: OrganizationsChartComponent,
    title: 'Org Chart',
  },
  {
    path: 'org_chart/:orgID',
    component: OrganizationsChartComponent,
    title: 'Org Chart',
  },
  {
    path: 'organizations',
    component: OrganizationsComponent,
    title: 'Organizations',
  },
  {
    path: 'organizations/:orgID',
    component: OrganizationsComponent,
    title: 'Organization',
  },
  {
    path: 'website_service_category',
    component: WebsiteServiceCategoryComponent,
    title: 'Website Service Categories',
  },
  {
    path: 'website_service_category/:websiteServiceCategoryID',
    component: WebsiteServiceCategoryComponent,
    title: 'Website Service Category',
  },

  { path: 'systems', component: SystemsComponent, title: 'Systems' },
  { path: 'systems/:sysID', component: SystemsComponent, title: 'System' },
  {
    path: 'systems_TIME',
    component: TimeComponent,
    title: 'Systems TIME Model',
  },
  {
    path: 'systems_TIME/:sysID',
    component: TimeComponent,
    title: 'System TIME Model',
  },
  {
    path: 'records_mgmt',
    component: RecordsManagementComponent,
    title: 'Records Management',
  },
  {
    path: 'records_mgmt/:recID',
    component: RecordsManagementComponent,
    title: 'Records Management',
  },
  { path: 'websites', component: WebsitesComponent, title: 'Websites' },
  {
    path: 'websites/:websiteID',
    component: WebsitesComponent,
    title: 'Website',
  },

  { path: 'FISMA', component: FismaComponent, title: 'FISMA Systems' },
  { path: 'FISMA/:fismaID', component: FismaComponent, title: 'FISMA System' },
  {
    path: 'FISMA_POC',
    component: FismaPocsComponent,
    title: 'FISMA Point of Contacts',
  },
  {
    path: 'FISMA_POC/:fismaID',
    component: FismaPocsComponent,
    title: 'FISMA Point of Contact',
  },

  {
    path: 'it_standards',
    component: ItStandardsComponent,
    title: 'IT Standards',
  },
  {
    path: 'it_standards/:standardID',
    component: ItStandardsComponent,
    title: 'IT Standard',
  },

  { path: 'artifacts', component: ArtifactsComponent, title: 'Artifacts' },
  { path: 'gear_model', component: GearModelComponent, title: 'GEAR Model' },

  {
    path: 'forms_glossary',
    component: FormsGlossaryComponent,
    title: 'Forms Glossary',
  },

  {
    path: 'gear_manager',
    component: GearManagerComponent,
    title: 'GEAR Manager',
  },

  {
    // Catch-all Redirect to Home
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
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

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      useHash: true,
      relativeLinkResolution: 'legacy',
    }),
  ],
  exports: [RouterModule],
  providers: [{ provide: TitleStrategy, useClass: TemplatePageTitleStrategy }],
})
export class AppRoutingModule {}
