import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { FormsGlossaryComponent } from './forms-glossary.component';

describe('FormsGlossaryComponent', () => {
  let component: FormsGlossaryComponent;
  let fixture: ComponentFixture<FormsGlossaryComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ FormsGlossaryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FormsGlossaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
