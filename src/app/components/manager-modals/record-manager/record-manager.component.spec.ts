import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RecordManagerComponent } from './record-manager.component';

describe('RecordManagerComponent', () => {
  let component: RecordManagerComponent;
  let fixture: ComponentFixture<RecordManagerComponent>;

  beforeEach(async(() => {
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
