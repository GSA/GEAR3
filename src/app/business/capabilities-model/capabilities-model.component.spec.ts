import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CapabilitiesModelComponent } from './capabilities-model.component';

describe('CapabilityModelComponent', () => {
  let component: CapabilitiesModelComponent;
  let fixture: ComponentFixture<CapabilitiesModelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CapabilitiesModelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CapabilitiesModelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
