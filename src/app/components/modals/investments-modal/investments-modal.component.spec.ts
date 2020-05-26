import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InvestmentsModalComponent } from './investments-modal.component';

describe('InvestmentsModalComponent', () => {
  let component: InvestmentsModalComponent;
  let fixture: ComponentFixture<InvestmentsModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InvestmentsModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InvestmentsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
