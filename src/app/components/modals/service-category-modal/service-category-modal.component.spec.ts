import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ServiceCategoryModalComponent } from './service-category-modal.component';

describe('ServiceCategoryModalComponent', () => {
  let component: ServiceCategoryModalComponent;
  let fixture: ComponentFixture<ServiceCategoryModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ServiceCategoryModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ServiceCategoryModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
