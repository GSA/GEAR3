import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { NgxChartsModule } from '@swimlane/ngx-charts';

import { SystemsComponent } from './systems/systems.component';
import { SystemsDetailsComponent } from './systems/details/systems-details.component';
import { SystemsModalComponent } from '../../components/modals/systems-modal/systems-modal.component';
import { SystemsManagerComponent } from './systems/manager/systems-manager.component';
import { TimeComponent } from './time/time.component';
import { TimeDetailsComponent } from './time/details/time-details.component';
import { RecordsManagementComponent } from './records-management/records-management.component';
import { RecordsManagementDetailsComponent } from './records-management/details/records-management-details.component';
import { RecordsModalComponent } from '../../components/modals/records-modal/records-modal.component';
import { RecordsManagementManagerComponent } from './records-management/manager/records-management-manager.component';
import { WebsitesComponent } from './websites/websites.component';
import { WebsitesDetailsComponent } from './websites/details/websites-details.component';
import { WebsitesModalComponent } from '../../components/modals/websites-modal/websites-modal.component';
import { WebsitesManagerComponent } from './websites/manager/websites-manager.component';
import { WebsiteServiceCategoryDetailsContentLiteComponent } from './websites/website-service-category-details-content/website-service-category-details-content.component';

const routes: Routes = [
  { path: 'systems', component: SystemsComponent, title: 'Systems' },
  { path: 'systems/:sysID', component: SystemsDetailsComponent, title: 'System' },
  { path: 'systems_manager/:sysID', component: SystemsManagerComponent, title: 'System Manager' },
  { path: 'systems_TIME', component: TimeComponent, title: 'Systems TIME Model' },
  { path: 'systems_TIME/:sysID', component: TimeDetailsComponent, title: 'System TIME Model' },
  { path: 'records_mgmt', component: RecordsManagementComponent, title: 'Records Management' },
  { path: 'records_mgmt/:recID', component: RecordsManagementDetailsComponent, title: 'Records Management' },
  { path: 'records_mgmt_manager/:recID', component: RecordsManagementManagerComponent, title: 'Records Management Manager' },
  { path: 'websites', component: WebsitesComponent, title: 'Websites' },
  { path: 'websites/:websiteID', component: WebsitesDetailsComponent, title: 'Website' },
  { path: 'websites_manager/:websiteID', component: WebsitesManagerComponent, title: 'Website Manager' },
];

@NgModule({
  declarations: [
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
    WebsiteServiceCategoryDetailsContentLiteComponent,
  ],
  imports: [
    SharedModule,
    NgxChartsModule,
    RouterModule.forChild(routes),
  ]
})
export class SystemsModule {}
