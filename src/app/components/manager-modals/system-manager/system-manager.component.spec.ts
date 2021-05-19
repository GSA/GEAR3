import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SystemManagerComponent } from './system-manager.component';

describe('SystemManagerComponent', () => {
  let component: SystemManagerComponent;
  let fixture: ComponentFixture<SystemManagerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SystemManagerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SystemManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
