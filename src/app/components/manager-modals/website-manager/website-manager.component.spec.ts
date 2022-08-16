import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WebsiteManagerComponent } from './website-manager.component';

describe('WebsiteManagerComponent', () => {
  let component: WebsiteManagerComponent;
  let fixture: ComponentFixture<WebsiteManagerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WebsiteManagerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WebsiteManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
