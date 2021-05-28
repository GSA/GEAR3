import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RecordsModalComponent } from './records-modal.component';

describe('RecordsModalComponent', () => {
  let component: RecordsModalComponent;
  let fixture: ComponentFixture<RecordsModalComponent>;

  beforeEach(async(() => {
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
