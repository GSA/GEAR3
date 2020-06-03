import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CapabilitiesModalComponent } from './capabilities-modal.component';

describe('CapabilitiesModalComponent', () => {
  let component: CapabilitiesModalComponent;
  let fixture: ComponentFixture<CapabilitiesModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CapabilitiesModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CapabilitiesModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
