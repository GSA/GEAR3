import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { OrganizationsChartComponent } from './organizations-chart.component';

describe('OrganizationsChartComponent', () => {
  let component: OrganizationsChartComponent;
  let fixture: ComponentFixture<OrganizationsChartComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ OrganizationsChartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OrganizationsChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
