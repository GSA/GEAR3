import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StandardsModalComponent } from './standards-modal.component';

describe('StandardsModalComponent', () => {
  let component: StandardsModalComponent;
  let fixture: ComponentFixture<StandardsModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StandardsModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StandardsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
