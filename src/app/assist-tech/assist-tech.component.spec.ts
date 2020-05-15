import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AssistTechComponent } from './assist-tech.component';

describe('AssistTechComponent', () => {
  let component: AssistTechComponent;
  let fixture: ComponentFixture<AssistTechComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AssistTechComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AssistTechComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
