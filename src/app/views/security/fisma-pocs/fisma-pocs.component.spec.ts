import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { FismaPocsComponent } from './fisma-pocs.component';

describe('FismaPocsComponent', () => {
  let component: FismaPocsComponent;
  let fixture: ComponentFixture<FismaPocsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ FismaPocsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FismaPocsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
