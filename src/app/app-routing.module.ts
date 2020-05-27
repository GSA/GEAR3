import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

// Main Components
import { HomeComponent } from './home/home.component'
import { AboutComponent } from './about/about.component'
import { AssistTechComponent } from './assist-tech/assist-tech.component'

// Strategy Components
import { FrameworkComponent } from './strategy/framework/framework.component'
import { InvestmentsComponent } from './strategy/investments/investments.component'

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'about', component: AboutComponent },
  { path: 'assist_tech', component: AssistTechComponent },

  { path: 'strategic_framework', component: FrameworkComponent },
  { path: 'investments', component: InvestmentsComponent },

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