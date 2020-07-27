import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ItStandardsModalComponent } from './it-standards-modal.component';

describe('ItStandardsModalComponent', () => {
  let component: ItStandardsModalComponent;
  let fixture: ComponentFixture<ItStandardsModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ItStandardsModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ItStandardsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
