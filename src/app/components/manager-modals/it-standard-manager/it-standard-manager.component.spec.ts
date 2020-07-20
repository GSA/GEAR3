import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ItStandardManagerComponent } from './it-standard-manager.component';

describe('ItStandardManagerComponent', () => {
  let component: ItStandardManagerComponent;
  let fixture: ComponentFixture<ItStandardManagerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ItStandardManagerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ItStandardManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
