import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FismaComponent } from './fisma.component';

describe('FismaComponent', () => {
  let component: FismaComponent;
  let fixture: ComponentFixture<FismaComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FismaComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FismaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
