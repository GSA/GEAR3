import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

import { ItStandardsComponent } from './it-standards/it-standards.component';
import { ItStandardsDetailsComponent } from './details/it-standards-details.component';
import { ItStandardsModalComponent } from '../../components/modals/it-standards-modal/it-standards-modal.component';
import { ItStandardsManagerComponent } from './manager/it-standards-manager.component';
import { TechCategoriesComponent } from './tech-categories/tech-categories.component';
import { TechCategoriesDetailsComponent } from './tech-categories/details/tech-categories-details.component';
import { TechCategoriesModelComponent } from './tech-categories-model/tech-categories-model.component';

const routes: Routes = [
  { path: 'it_standards', component: ItStandardsComponent, title: 'IT Standards' },
  { path: 'it_standards/:standardID', component: ItStandardsDetailsComponent, title: 'IT Standard' },
  { path: 'it_standards_manager', component: ItStandardsManagerComponent, title: 'IT Standard Manager' },
  { path: 'it_standards_manager/:standardID', component: ItStandardsManagerComponent, title: 'IT Standard Manager' },
  { path: 'it_standards/filtered/:deploymentType/:status', component: ItStandardsComponent, title: 'IT Standard' },
  { path: 'it_standards/filtered/:deploymentType', component: ItStandardsComponent, title: 'IT Standard' },
  { path: 'tech_categories', component: TechCategoriesComponent, title: 'Technology Categories' },
  { path: 'tech_categories/:techCatID', component: TechCategoriesDetailsComponent, title: 'Technology Category' },
  { path: 'tech_categories_model', component: TechCategoriesModelComponent, title: 'Technology Categories Model' },
];

@NgModule({
  declarations: [
    ItStandardsComponent,
    ItStandardsDetailsComponent,
    ItStandardsModalComponent,
    ItStandardsManagerComponent,
    TechCategoriesComponent,
    TechCategoriesDetailsComponent,
    TechCategoriesModelComponent,
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(routes),
  ]
})
export class TechnologiesModule {}
