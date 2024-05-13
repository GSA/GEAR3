import { Meta,StoryFn, moduleMetadata } from '@storybook/angular';
import { ModalComponent } from './modal.component';
import { FormatURLPipe } from '../../pipes/format-url.pipe';
import { SafePipe } from '../../pipes/safe-html.pipe';
import doc from './modal.component.md';

export default {
  /* 👇 The title prop is optional.
  * See https://storybook.js.org/docs/angular/configure/overview#configure-story-loading
  * to learn how to generate automatic titles
  */
  title: 'Components/Modal',
  component: ModalComponent,
  parameters: {
      docs: {
        description: {
          component: 'A modal disables page content and focuses the user’s attention on a single task or message. A modal prevents interaction with page content until the user completes an action or dismisses the modal. This intentionally interrupts the user’s workflow.',
        }
      },
      guidanceTabAddon:{
        data: doc,
      },
    },
    decorators: [
      moduleMetadata({
        declarations: [FormatURLPipe, SafePipe],
        providers: [ FormatURLPipe, SafePipe]
      })
    ]
} as Meta;

  //👇 We create a “template” of how args map to rendering
  const Template: StoryFn = (args) => ({
    props:args,
    template:`
    <button 
      type="button" 
      class="dx-button usa-button margin-y-1px" 
      [attr.aria-controls] ="modalData.modalID" 
      data-open-modal >
        Open default modal
    </button>
    <button 
      type="button" 
      class="dx-button usa-button margin-y-1px" 
      [attr.aria-controls] ="modalData2.modalID" 
      data-open-modal >
        Open large modal
    </button>
    <button 
      type="button" 
      class="dx-button usa-button margin-y-1px" 
      [attr.aria-controls]="modalData3.modalID" 
      data-open-modal >
      Open modal with forced action
    </button>
    <button 
      type="button" 
      class="dx-button usa-button margin-y-1px" 
      [attr.aria-controls]="modalData4.modalID" 
      data-open-modal >
      Open modal with checkbox
    </button>
    <ng-template #modalFormTemplate>
      <div class="usa-checkbox">
        <input
          class="usa-checkbox__input"
          id="checkbox-accept"
          type="checkbox"
          name="select-row">
        <label class="usa-checkbox__label" for="checkbox-accept"><strong>I understand and accept</strong></label>
      </div>
    </ng-template>
    <lib-modal [modalData] = "modalData"></lib-modal>
    <lib-modal [modalData] = "modalData2"></lib-modal>
    <lib-modal [modalData] = "modalData3"></lib-modal>
    <lib-modal [modalData] = "modalData4" [modalForm]="modalFormTemplate" [primaryButtonDisabled]="buttonDisabled"></lib-modal>`
  });

  export const Default = Template.bind({});

  Default.args = {
    modalData : {
      modalID: "modal-" + Math.floor(Math.random() * 10000),
      modalHeader: "Confirm Remove",
      modalText: "Are you sure you want to remove this file?",
      primaryButton: "Yes",
      secondaryButton: "No"
    },
    modalData2 : {
      modalID: "modal-" + Math.floor(Math.random() * 10000),
      modalHeader: "Modal Header",
      modalText: "<b>This is a large modal window meant for content only</b>. "
                + "This could be large paragraphs of text. larger content with actions to be taken." 
                + "This could be large paragraphs of text. <br/><br/>"
                + "This is a large modal window meant for content only. This could be large paragraphs of text. "
                + "larger content with actions to be taken. This could be large paragraphs of text. "
                + "This could be large paragraphs of text. <br/><br/>"
                + "This could be large paragraphs of text. larger content with actions to be taken." 
                + "This could be large paragraphs of text. <br/><br/>"
                + "This is a large modal window meant for content only. This could be large paragraphs of text. "
                + "larger content with actions to be taken. This could be large paragraphs of text. "
                + "This could be large paragraphs of text. <br/><br/>"
                + "This is a large modal window meant for content only. This could be large paragraphs of text. "
                + "larger content with actions to be taken. This could be large paragraphs of text. "              + "This is a large modal window meant for content only. This could be large paragraphs of text. "
                + "larger content with actions to be taken. This could be large paragraphs of text. "
                + "This is a large modal window meant for content only. This could be large paragraphs of text. "
                + "larger content with actions to be taken. This could be large paragraphs of text. "
                + "This is a large modal window meant for content only. This could be large paragraphs of text. "
                + "larger content with actions to be taken. This could be large paragraphs of text. ",
      primaryButton: "Primary",
      secondaryButton: "Secondary",
      modalType: "content",
      size: "large"
    },
    modalData3 : {
      modalID: "modal-" + Math.floor(Math.random() * 10000),
      modalHeader: "Session Expiring",
      modalText: "Your session is about to expire.<br/><br/>If you need more time, select <b>Continue Session</b> to stay connected.",
      primaryButton: "Continue Session",
      secondaryButton: "Sign Off",
      modalType: "actionForced"
    },
    modalData4 : {
      modalID: "modal-" + Math.floor(Math.random() * 10000),
      modalHeader: "Terms of Service",
      modalText: "<p>*******************WARNING*******************</p>"
        + "<p>"
        + "This is a U.S. General Services Administration Federal government computer system that is "
        + "\"FOR OFFICIAL USE ONLY.\""
        + "</p>"
        + "<p>"
        + "This system is subject to monitoring. Therefore, no expectation of privacy is to be assumed."
        + "Individuals found performaing unauthorized activities are subject to disciplinary action "
        + "including criminal prosecution."
        + "</p>",
      primaryButton: "Accept",
      secondaryButton: "Decline",
      modalType: "actionForced"
    }
  };

  Default.argTypes = {
    modalData: {
      name: 'modalData',
      description: 'Object of modal data',
      type : 'IModal',
      table:{
        type:{
          summary: "Data Modal IModal",
          detail:  ` {
                        modalID: string;
                        modalHeader: string;
                        modalText: string;
                        primaryButton?: string;
                        secondaryButton?: string;
                        modalType?: "actionForced"|"content";
                        hideFooter?: boolean;
                        size?: "large"|"custom";
                      }`
        }
      }
    },
    modalForm: {
      name: 'modalForm',
      type:'TemplateRef<any>',
      description: 'Include <ng-template> content after the modal text. Likely used for forms, though not strictly limited to them.'
    },
    primaryButtonDisabled: {
      name: 'primaryButtonDisabled',
      type:'boolean',
      description: 'Used to tell if the primary button should be disabled. Defaults to false.'
    },
    secondaryButtonDisabled:  {
      name: 'secondaryButtonDisabled',
      type:'boolean',
      description: 'Used to tell if the secondary button should be disabled. Defaults to false.'
    },
    modalID: {
      name: 'modalID',
      type:'string',
      description: 'Unique identifier for modal'
    },
    actionClick: {
      name:'actionClick',
      type:'EventEmitter<string>',
      description: 'This method will emit the button value to the parent component when the user clicks on a primary or secondary button in the modal component.',
      table:{
        type:{
          summary: "actionClick()",
          detail:  `
          buttonClick(event){
            this.actionClick.emit(event);
          }
          `
        }
      }
    },
    actionResetModal: {
      name:'actionResetModal',
      type:'EventEmitter<string>',
      description:'This method will emit an event when we click the close button to reset the modal.',
      table:{
        type:{
          summary: "actionResetModal()",
          detail:  `
          resetModal(event){
            this.actionResetModal.emit(event);
          }
          `
        }
      }
    }
  };