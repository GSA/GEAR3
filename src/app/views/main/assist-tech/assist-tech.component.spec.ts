import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AssistTechComponent } from './assist-tech.component';

describe('AssistTechComponent', () => {
  let component: AssistTechComponent;
  let fixture: ComponentFixture<AssistTechComponent>;

  beforeEach(waitForAsync(() => {
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
