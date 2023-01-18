import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { WebsitesModalComponent } from './websites-modal.component';

describe('WebsitesModalComponent', () => {
  let component: WebsitesModalComponent;
  let fixture: ComponentFixture<WebsitesModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [WebsitesModalComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WebsitesModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
