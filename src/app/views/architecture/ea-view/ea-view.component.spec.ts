import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { EAViewComponent } from './ea-view.component';

describe('EAViewComponent', () => {
  let component: EAViewComponent;
  let fixture: ComponentFixture<EAViewComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ EAViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EAViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
