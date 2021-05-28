import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

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

// Systems
import { SystemsComponent } from './views/systems/systems/systems.component';
import { TimeComponent } from './views/systems/time/time.component';
import { RecordsManagementComponent } from './views/systems/records-management/records-management.component';

// Security
import { FismaComponent } from './views/security/fisma/fisma.component';
import { FismaPocsComponent } from './views/security/fisma-pocs/fisma-pocs.component';

// Technologies
import { ItStandardsComponent } from './views/technologies/it-standards/it-standards.component';

// Enterprise Architecture
import { ArtifactsComponent } from './views/architecture/artifacts/artifacts.component';
import { GearModelComponent } from './views/architecture/gear-model/gear-model.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'search', component: GlobalSearchComponent },
  { path: 'about', component: AboutComponent },
  { path: 'about/:tab', component: AboutComponent },
  { path: 'assist_tech', component: AssistTechComponent },

  { path: 'strategic_framework', component: FrameworkComponent },
  { path: 'investments', component: InvestmentsComponent },
  { path: 'investments/:investID', component: InvestmentsComponent },

  { path: 'capabilities_model', component: CapabilitiesModelComponent },
  { path: 'capabilities', component: CapabilitiesComponent },
  { path: 'capabilities/:capID', component: CapabilitiesComponent },
  { path: 'org_chart', component: OrganizationsChartComponent },
  { path: 'organizations', component: OrganizationsComponent },
  { path: 'organizations/:orgID', component: OrganizationsComponent },

  { path: 'systems', component: SystemsComponent },
  { path: 'systems/:sysID', component: SystemsComponent },
  { path: 'systems_TIME', component: TimeComponent },
  { path: 'records_mgmt', component: RecordsManagementComponent },
  { path: 'records_mgmt/:recID', component: RecordsManagementComponent },

  { path: 'FISMA', component: FismaComponent },
  { path: 'FISMA/:fismaID', component: FismaComponent },
  { path: 'FISMA_POC', component: FismaPocsComponent },

  { path: 'it_standards', component: ItStandardsComponent },
  { path: 'it_standards/:standardID', component: ItStandardsComponent },

  { path: 'artifacts', component: ArtifactsComponent },
  { path: 'gear_model', component: GearModelComponent },

  { path: 'forms_glossary', component: FormsGlossaryComponent },

  { path: 'gear_manager', component: GearManagerComponent },

  {  // Catch-all Redirect to Home
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
