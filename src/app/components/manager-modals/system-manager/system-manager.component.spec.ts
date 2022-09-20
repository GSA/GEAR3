import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SystemManagerComponent } from './system-manager.component';

describe('SystemManagerComponent', () => {
  let component: SystemManagerComponent;
  let fixture: ComponentFixture<SystemManagerComponent>;

  beforeEach(waitForAsync(() => {
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
