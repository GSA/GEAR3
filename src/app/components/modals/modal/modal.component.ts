import { Component, OnInit, Input, Output, EventEmitter, ElementRef, AfterViewInit, Renderer2, TemplateRef } from '@angular/core';
import { IModal } from '../feedback/modal.model';
import * as modal from 'node_modules/@uswds/uswds/packages/usa-modal/src/index.js';

@Component({
  selector: 'lib-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss']
})
export class ModalComponent implements OnInit, AfterViewInit {

  @Output() actionClick = new EventEmitter<string>();
  @Output() actionResetModal = new EventEmitter<string>();  
  @Input() modalData: IModal;
  @Input() modalForm: TemplateRef<any>;
  @Input() primaryButtonDisabled = false;
  @Input() secondaryButtonDisabled = false;
  @Input() modalID: string;
  @Input() baseURL: string;

  headingID: string;
  descriptionID: string;

  constructor(private elRef: ElementRef, private renderer: Renderer2) { }

  ngOnInit(): void {
    /* assign unique heading and description id, for aria-label */

    if (this.modalData) {
      this.modalData.modalID = this.modalID ? this.modalID : this.modalData?.modalID;
      this.headingID = `${this.modalData.modalID}-heading`;
      this.descriptionID = `${this.modalData.modalID}-description`;
    }
  }

  /* this code primarily handles issues with the modal functionality breaking due to USWDS code in
  node_modules/uswds/src/js/components/modal.js, which appends a duplicate modal div to the end of the DOM. Also
  adds data-force-action attribute to usa-modal-wrapper and usa-modal divs (This doesn't work correctly if 
  added directly in the HTML code) */
  ngAfterViewInit(): void {
    window.setTimeout(() => {
      modal.on(this.elRef.nativeElement);
      let modals = Array.from(document.body.querySelectorAll("div#"+this.modalData.modalID));
      if (modals.length > 0) {
        let numModals = modals.length;
        if (numModals > 1) {
          modals.forEach((el) =>  {
            if(el.parentNode?.nodeName === "BODY") {
              //remove the duplicate modal div
              let modalElement = this.elRef.nativeElement;
              let duplicateModal = modalElement.querySelector("div#"+this.modalData.modalID)
              this.renderer.removeChild(modalElement, duplicateModal);
              modals.splice(modals.indexOf(duplicateModal),1);
            }
          });
        }
        /* override the modal overlay background opacity, with inline style (inline style is necessary as adding 
        another class to the div with class usa-modal-overlay breaks the forced action functionality) */ 
        let modalOverlay = modals[0].querySelector("div.usa-modal-overlay");
        this.renderer.setStyle(modalOverlay, 'background', 'rgba(0,0,0,0.4)');
        /* remove the duplicate aria tags */
        this.renderer.removeAttribute(modalOverlay.querySelector("div.usa-modal"), "id");
        this.renderer.removeAttribute(modalOverlay.querySelector("div.usa-modal"), "aria-labelledby");
        this.renderer.removeAttribute(modalOverlay.querySelector("div.usa-modal"), "aria-describedby");
        /* if modal is not appended to the body, add styles to center the modal */
        if (modals[0].parentNode?.nodeName === "LIB-MODAL") {
          this.renderer.addClass(modalOverlay.querySelector("div.usa-modal"), "dx-modal__not-appended");
        }
        /* add forced action attribute, if modalType = actionForced */
        if ((this.modalData.modalType === "actionForced") || (this.modalData.modalType === "actionForcedWithClose")) {
          this.renderer.setAttribute(modals[0], "data-force-action", "true");
          this.renderer.setAttribute(modalOverlay.querySelector("div.usa-modal"), "data-force-action", "true");
        }
      }   
    }, 100);  
  }

  ngOnDestroy(): void {
    document['modalInit'] = false;
    modal.off();
  }

  /*when a primary or secondary button clicked (on a non content only modal), emit the button value*/
  buttonClick(event){
    this.actionClick.emit(event);
  }

  /* when the close button (X) is clicked emit to reset modal*/
  resetModal(event){
    this.actionResetModal.emit(event);
  }
}
