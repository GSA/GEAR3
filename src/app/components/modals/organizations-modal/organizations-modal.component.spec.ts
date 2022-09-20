import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { OrganizationsModalComponent } from './organizations-modal.component';

describe('OrganizationsModalComponent', () => {
  let component: OrganizationsModalComponent;
  let fixture: ComponentFixture<OrganizationsModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ OrganizationsModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OrganizationsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
