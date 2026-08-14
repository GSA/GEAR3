import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

import { GearModelComponent } from './gear-model/gear-model.component';

const routes: Routes = [
  { path: 'gear_model', component: GearModelComponent, title: 'GEAR Model' },
  // { path: 'ea_view', component: EAViewComponent, title: 'EA View' },
];

@NgModule({
  declarations: [
    GearModelComponent,
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(routes),
  ]
})
export class ArchitectureModule {}
