import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GearManagerFailedLoginComponent } from './gear-manager-failed-login.component';

describe('GearManagerFailedLoginComponent', () => {
  let component: GearManagerFailedLoginComponent;
  let fixture: ComponentFixture<GearManagerFailedLoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GearManagerFailedLoginComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GearManagerFailedLoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});