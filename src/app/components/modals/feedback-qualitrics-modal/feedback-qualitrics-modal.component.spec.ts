import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeedbackQualitricsModalComponent } from './feedback-qualitrics-modal.component';

describe('FeedbackQualitricsModalComponent', () => {
  let component: FeedbackQualitricsModalComponent;
  let fixture: ComponentFixture<FeedbackQualitricsModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FeedbackQualitricsModalComponent]
    });
    fixture = TestBed.createComponent(FeedbackQualitricsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
