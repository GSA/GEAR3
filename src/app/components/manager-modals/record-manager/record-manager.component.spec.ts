import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { RecordManagerComponent } from './record-manager.component';

describe('RecordManagerComponent', () => {
  let component: RecordManagerComponent;
  let fixture: ComponentFixture<RecordManagerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ RecordManagerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RecordManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
