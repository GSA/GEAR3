import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

import { CapabilitiesModelComponent } from './capabilities-model/capabilities-model.component';
import { CapabilitiesComponent } from './capabilities/capabilities.component';
import { CapabilitiesDetailsComponent } from './capabilities/details/capabilities-details.component';
import { CapabilitiesModalComponent } from '../../components/modals/capabilities-modal/capabilities-modal.component';
import { CapabilityManagerComponent } from './capabilities/manager/capability-manager.component';
import { OrganizationsChartComponent } from './organizations-chart/organizations-chart.component';
import { OrganizationsComponent } from './organizations/organizations.component';
import { OrganizationsDetailsComponent } from './organizations/details/organizations-details.component';
import { OrganizationsModalComponent } from '../../components/modals/organizations-modal/organizations-modal.component';
import { WebsiteServiceCategoryComponent } from './website-service-category/website-service-category.component';
import { WebsiteServiceCategoryDetailsComponent } from './website-service-category/details/website-service-category-details.component';
import { WebsiteServiceCategoryDetailsContentComponent } from './website-service-category/website-service-category-details-content/website-service-category-details-content.component';
import { WebsiteServiceCategoryModalComponent } from '../../components/modals/website-service-category-modal/website-service-category-modal.component';

const routes: Routes = [
  { path: 'capabilities_model', component: CapabilitiesModelComponent, title: 'Capabilities Model' },
  { path: 'capabilities_model/:capID', component: CapabilitiesModelComponent, title: 'Capability Model' },
  { path: 'capabilities', component: CapabilitiesComponent, title: 'Capabilities' },
  { path: 'capabilities/:capID', component: CapabilitiesDetailsComponent, title: 'Capabilities' },
  { path: 'capabilities_manager/:capId', component: CapabilityManagerComponent, title: 'Capabilities Manager' },
  { path: 'org_chart', component: OrganizationsChartComponent, title: 'Org Chart' },
  { path: 'org_chart/:orgID', component: OrganizationsChartComponent, title: 'Org Chart' },
  { path: 'organizations', component: OrganizationsComponent, title: 'Organizations' },
  { path: 'organizations/:orgID', component: OrganizationsDetailsComponent, title: 'Organization' },
  { path: 'website_service_category', component: WebsiteServiceCategoryComponent, title: 'Website Service Categories' },
  { path: 'website_service_category/:websiteServiceCategoryID', component: WebsiteServiceCategoryDetailsComponent, title: 'Website Service Category' },
];

@NgModule({
  declarations: [
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
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(routes),
  ]
})
export class EnterpriseModule {}
