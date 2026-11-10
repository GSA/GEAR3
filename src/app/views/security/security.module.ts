import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

import { FismaComponent } from './fisma/fisma.component';
import { FismaDetailsComponent } from './fisma/details/fisma-details.component';
import { FismaModalComponent } from '../../components/modals/fisma-modal/fisma-modal.component';
import { FismaPocsComponent } from './fisma-pocs/fisma-pocs.component';
import { FismaPocsDetailsComponent } from './fisma-pocs/details/fisma-pocs-details.component';

const routes: Routes = [
  { path: 'FISMA', component: FismaComponent, title: 'FISMA Systems' },
  { path: 'FISMA/:fismaID', component: FismaDetailsComponent, title: 'FISMA System' },
  { path: 'FISMA_POC', component: FismaPocsComponent, title: 'FISMA Point of Contacts' },
  { path: 'FISMA_POC/:fismaID', component: FismaPocsDetailsComponent, title: 'FISMA Point of Contact' },
];

@NgModule({
  declarations: [
    FismaComponent,
    FismaDetailsComponent,
    FismaModalComponent,
    FismaPocsComponent,
    FismaPocsDetailsComponent,
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(routes),
  ]
})
export class SecurityModule {}
