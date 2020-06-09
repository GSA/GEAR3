import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplicationsModalComponent } from './applications-modal.component';

describe('ApplicationsModalComponent', () => {
  let component: ApplicationsModalComponent;
  let fixture: ComponentFixture<ApplicationsModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ApplicationsModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ApplicationsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
