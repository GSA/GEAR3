import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CapabilityManagerComponent } from './capability-manager.component';

describe('CapabilityManagerComponent', () => {
  let component: CapabilityManagerComponent;
  let fixture: ComponentFixture<CapabilityManagerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CapabilityManagerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CapabilityManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
