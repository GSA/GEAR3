import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

// Main
import { HomeComponent } from './main/home/home.component';
import { AboutComponent } from './main/about/about.component';
import { AssistTechComponent } from './main/assist-tech/assist-tech.component';
import { FormsGlossaryComponent } from './main/forms-glossary/forms-glossary.component';
import { VideosComponent } from './main/videos/videos.component';

// Strategy
import { FrameworkComponent } from './strategy/framework/framework.component';
import { InvestmentsComponent } from './strategy/investments/investments.component';

// Business
import { CapabilitiesModelComponent } from './business/capabilities-model/capabilities-model.component';
import { CapabilitiesComponent } from './business/capabilities/capabilities.component';
import { OrganizationsComponent } from './business/organizations/organizations.component';

// Applications
import { SystemsComponent } from './applications/systems/systems.component';
import { AppsComponent } from './applications/apps/apps.component';
import { TimeComponent } from './applications/time/time.component';

// Security
import { FismaComponent } from './security/fisma/fisma.component';
import { FismaPocsComponent } from './security/fisma-pocs/fisma-pocs.component';

// Technologies
import { ItStandardsComponent } from './technologies/it-standards/it-standards.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'about', component: AboutComponent },
  { path: 'assist_tech', component: AssistTechComponent },

  { path: 'strategic_framework', component: FrameworkComponent },
  { path: 'investments', component: InvestmentsComponent },

  { path: 'capabilities_model', component: CapabilitiesModelComponent },
  { path: 'capabilities', component: CapabilitiesComponent },
  { path: 'organizations', component: OrganizationsComponent },

  { path: 'systems', component: SystemsComponent },
  { path: 'applications', component: AppsComponent },
  { path: 'applications_TIME', component: TimeComponent },

  { path: 'FISMA', component: FismaComponent },
  { path: 'FISMA_POC', component: FismaPocsComponent },

  { path: 'it_standards', component: ItStandardsComponent },
  
  { path: 'forms_glossary', component: FormsGlossaryComponent },
  { path: 'videos', component: VideosComponent },

  {  // Catch-all Redirect to Home
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
