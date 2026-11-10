import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { NgxChartsModule } from '@swimlane/ngx-charts';

import { FrameworkComponent } from './framework/framework.component';
import { InvestmentsComponent } from './investments/investments.component';
import { InvestmentsDetailsComponent } from './investments/details/investments-details.component';
import { InvestmentsModalComponent } from '../../components/modals/investments-modal/investments-modal.component';

const routes: Routes = [
  { path: 'strategic_framework', component: FrameworkComponent, title: 'Strategic Framework' },
  { path: 'investments', component: InvestmentsComponent, title: 'Investments' },
  { path: 'investments/:investID', component: InvestmentsDetailsComponent, title: 'Investment' },
];

@NgModule({
  declarations: [
    FrameworkComponent,
    InvestmentsComponent,
    InvestmentsDetailsComponent,
    InvestmentsModalComponent,
  ],
  imports: [
    SharedModule,
    NgxChartsModule,
    RouterModule.forChild(routes),
  ]
})
export class StrategyModule {}
