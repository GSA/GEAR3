import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { GearManagerComponent } from './gear-manager.component';

describe('GearManagerComponent', () => {
  let component: GearManagerComponent;
  let fixture: ComponentFixture<GearManagerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ GearManagerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GearManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
