import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ItStandardsComponent } from './it-standards.component';

describe('ItstandardsComponent', () => {
  let component: ItStandardsComponent;
  let fixture: ComponentFixture<ItStandardsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ItStandardsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ItStandardsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
