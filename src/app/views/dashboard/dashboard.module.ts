import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { SharedModule } from '../../shared/shared.module';
import { DashboardComponent } from './dashboard.component';

const routes: Routes = [
  { path: '', component: DashboardComponent, title: 'Dashboard' }
];

@NgModule({
  declarations: [DashboardComponent],
  imports: [
    SharedModule,
    RouterModule.forChild(routes),
    NgxChartsModule
  ]
})
export class DashboardModule {}
