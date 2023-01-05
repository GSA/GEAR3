import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { WebsiteServiceCategoryModalComponent } from './website-service-category-modal.component';

describe('ServiceCategoryModalComponent', () => {
  let component: WebsiteServiceCategoryModalComponent;
  let fixture: ComponentFixture<WebsiteServiceCategoryModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [WebsiteServiceCategoryModalComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WebsiteServiceCategoryModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
