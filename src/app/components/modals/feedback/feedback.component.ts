import { Component, OnInit, OnDestroy } from '@angular/core';
import { postData, respData} from './feedback';
import { Router, NavigationEnd } from '@angular/router';
import { FeedbackService } from './feedback.service';
import { IModal } from './modal.model';
import { filter, Subscription} from 'rxjs';

@Component({
  selector: 'lib-feedback',
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.scss']
})
export class FeedbackComponent implements OnInit, OnDestroy {

  successAlert: boolean = false;
  feedbackVisible: boolean =true;
  public href: string;
  url: string ;
  private subscription: Subscription = new Subscription();

  modalData: IModal = {
    modalID: "modal-" + Math.floor(Math.random() * 10000),
    modalHeader: "Feedback",
    modalText: "<div class='margin-bottom-2 dx-feedback-description'>Your feedback is greatly appreciated, please provide details below.</div>"
  };

  constructor(private router : Router, private feedbackService:FeedbackService){}
  feedbackData:postData;
  resultData: respData;
  feedbackInput:any;
  currentUrl;
  pageName;

  ngOnInit(): void { 
    this.currentPage();   
  }

  ngOnDestroy(){
    this.subscription.unsubscribe();
  }

   /**
   * @description send data to api
   */
  sendData() { 
   
    this.currentPage();
    this.currentUrl = window.location.href;

    let feedbackData: postData = {
      'data': {
        'type':'node--feedback',
        'attributes':{
          'field_feedback':  {'value' : this.feedbackInput},
          'field_feedback_url' : this.currentUrl,      
          'field_page_title': this.pageName,
        }
      }
    };

    //passing the json data and subscribe to the observable
    this.subscription.add( 
      this.feedbackService.addFeedback(feedbackData).subscribe((res : respData)=>{})
    )

    //hide modal header, when success message is displayed.
    this.feedbackVisible = false;
    this.successAlert=true;
    (document.querySelector('.dx-feedback-description') as HTMLElement).style.display = 'none';
  }

   /**
   * @description To set the current page
   */
  currentPage() {
    this.subscription.add( 
      this.router.events.pipe(filter((event: NavigationEnd) => event instanceof NavigationEnd)).subscribe(event => {       
        if (event.url === '/') {
          this.pageName = 'home';      
        } else {
          this.pageName = event.url.replace(/\//g,'').replace(/\-/g,' ');
        }
      })
    )
  }
}