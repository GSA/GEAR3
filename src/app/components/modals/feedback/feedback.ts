export class postData {
    'data': {
      'type':string,
      'attributes':{
        'field_feedback': {value:string},
        'field_feedback_url' : string,      
        'field_page_title': string
      }
    }
  }
//to test the response
export interface respData {
    'data': {
        'type':string,
        'attributes':{
          'field_feedback': {value:string},
          'field_feedback_url' : string,      
          'field_page_title': string
        }
      }
}