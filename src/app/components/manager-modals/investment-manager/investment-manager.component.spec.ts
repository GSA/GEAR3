import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InvestmentManagerComponent } from './investment-manager.component';

describe('InvestmentManagerComponent', () => {
  let component: InvestmentManagerComponent;
  let fixture: ComponentFixture<InvestmentManagerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InvestmentManagerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InvestmentManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
