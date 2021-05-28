import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RecordsManagementComponent } from './records-management.component';

describe('RecordsManagementComponent', () => {
  let component: RecordsManagementComponent;
  let fixture: ComponentFixture<RecordsManagementComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RecordsManagementComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RecordsManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
