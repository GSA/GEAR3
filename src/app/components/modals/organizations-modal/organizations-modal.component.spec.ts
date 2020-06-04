import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganizationsModalComponent } from './organizations-modal.component';

describe('OrganizationsModalComponent', () => {
  let component: OrganizationsModalComponent;
  let fixture: ComponentFixture<OrganizationsModalComponent>;

  beforeEach(async(() => {
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
