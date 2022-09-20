import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { GearModelComponent } from './gear-model.component';

describe('GearModelComponent', () => {
  let component: GearModelComponent;
  let fixture: ComponentFixture<GearModelComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ GearModelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GearModelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
