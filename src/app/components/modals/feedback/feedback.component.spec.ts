import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { EMPTY, Observable, of } from 'rxjs';
import { FeedbackService } from '../../services/feedback.service';
import { FeedbackComponent } from './feedback.component';


class FeedbackResultMock {
	body?: string;
	id: number;
}
describe('FeedbackComponent', () => {
  let component: FeedbackComponent;  
  let fixture: ComponentFixture<FeedbackComponent>;
  let feedbackService  = {addFeedback: function(body):Observable<FeedbackResultMock > { 
    return EMPTY; 
  }};

  const postDataMock = { body: "test feedback data", id:1 };
  const mockRouter = { events: EMPTY }

  beforeEach(waitForAsync(() => {

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: FeedbackService, useValue: feedbackService }
      ]
    })    
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FeedbackComponent);
    component = fixture.componentInstance;
    // component.feedbackService = feedbackService;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('sendData() should call http Post method', () => {
    spyOn(feedbackService,"addFeedback")
      .and.returnValue(of(postDataMock));
      // feedbackService.addFeedback(postDataMock).subscribe(
      //   data => expect(data).toEqual(postDataMock, 'test feedback data'),
      //   fail()
      // );
  
      // // should have made one request to POST feedback
      // const req = httpTestingController.expectOne(feedbackService.feedbackBody);
      // expect(req.request.method).toEqual('POST');
      // expect(req.request.body).toEqual(feedbackService.feedbackBody);
  
      // // Expect server to return the feedback body after POST
      // const expectedResponse = new HttpResponse({ status: 201, statusText: 'Created', body: postDataMock });
      // req.event(expectedResponse);

    component.sendData();
    expect(component.successAlert).toBeTrue();
  });

});
