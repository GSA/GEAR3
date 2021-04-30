import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GInvoicingComponent } from './g-invoicing.component';

describe('GInvoicingComponent', () => {
  let component: GInvoicingComponent;
  let fixture: ComponentFixture<GInvoicingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GInvoicingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GInvoicingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
