import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SystemsModalComponent } from './systems-modal.component';

describe('SystemsModalComponent', () => {
  let component: SystemsModalComponent;
  let fixture: ComponentFixture<SystemsModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SystemsModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SystemsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
