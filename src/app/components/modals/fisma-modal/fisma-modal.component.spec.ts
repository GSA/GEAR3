import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FismaModalComponent } from './fisma-modal.component';

describe('FismaModalComponent', () => {
  let component: FismaModalComponent;
  let fixture: ComponentFixture<FismaModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FismaModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FismaModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
