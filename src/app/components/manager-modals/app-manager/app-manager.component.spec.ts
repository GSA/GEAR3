import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AppManagerComponent } from './app-manager.component';

describe('AppManagerComponent', () => {
  let component: AppManagerComponent;
  let fixture: ComponentFixture<AppManagerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AppManagerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
