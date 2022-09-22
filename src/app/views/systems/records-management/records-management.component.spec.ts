import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { RecordsManagementComponent } from './records-management.component';

describe('RecordsManagementComponent', () => {
  let component: RecordsManagementComponent;
  let fixture: ComponentFixture<RecordsManagementComponent>;

  beforeEach(waitForAsync(() => {
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
