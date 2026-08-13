import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

import { HomeComponent } from './home/home.component';
import { GlobalSearchComponent } from './global-search/global-search.component';
import { AboutComponent } from './about/about.component';
import { AssistTechComponent } from './assist-tech/assist-tech.component';
import { FormsComponent } from './forms-glossary/forms/forms.component';
import { GlossaryComponent } from './forms-glossary/glossary/glossary.component';
import { GearManagerComponent } from './gear-manager/gear-manager.component';
import { GearManagerFailedLoginComponent } from './gear-manager-failed-login/gear-manager-failed-login.component';
import { DataDictionaryComponent } from './data-dictionary/data-dictionary.component';
import { FeedbackComponent } from './feedback/feedback.component';

const routes: Routes = [
  { path: 'home', component: HomeComponent, title: 'Home' },
  { path: 'search/:keyword', component: GlobalSearchComponent, title: 'Search' },
  { path: 'search/:reportType/:id', component: GlobalSearchComponent, title: 'Search' },
  { path: 'about', component: AboutComponent, title: 'About' },
  { path: 'about/:tab', component: AboutComponent, title: 'About' },
  { path: 'assist_tech', component: AssistTechComponent, title: 'Assistive Technology' },
  { path: 'forms', component: FormsComponent, title: 'Forms' },
  { path: 'glossary', component: GlossaryComponent, title: 'Glossary' },
  { path: 'gear_manager', component: GearManagerComponent, title: 'GEAR Manager' },
  { path: 'failed-login', component: GearManagerFailedLoginComponent, title: 'Access Denied' },
  { path: 'data_dictionary', component: DataDictionaryComponent, title: 'Data Dictionary' },
  { path: 'feedback', component: FeedbackComponent, title: 'Feedback' },
];

@NgModule({
  declarations: [
    HomeComponent,
    GlobalSearchComponent,
    AboutComponent,
    AssistTechComponent,
    FormsComponent,
    GlossaryComponent,
    GearManagerComponent,
    GearManagerFailedLoginComponent,
    DataDictionaryComponent,
    FeedbackComponent,
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(routes),
  ]
})
export class MainModule {}
