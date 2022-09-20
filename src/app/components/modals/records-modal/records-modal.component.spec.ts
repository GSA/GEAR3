import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { RecordsModalComponent } from './records-modal.component';

describe('RecordsModalComponent', () => {
  let component: RecordsModalComponent;
  let fixture: ComponentFixture<RecordsModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ RecordsModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RecordsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
